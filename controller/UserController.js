
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

import nodemailer from 'nodemailer';
import mandrillTransport from 'mandrill-nodemailer-transport';

export const signup = async (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                status: 400,
                message: 'Name, email and password are required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 400,
                message: 'User already exists with this email'
            });
        }

        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({
            status: 201,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            status: 500,
            message: 'Error creating user',
            error: error.message
        });
    }
}

export const login = async (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET;

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 400,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: 401,
                message: 'Invalid email or password'
            });
        }

        if (user.status === "inactive") {
            return res.status(401).json({
                status: 401,
                message: 'User is inactive'
            });
        }

        if (user.role !== "admin") {
            if (user.isLoggedIn && user.authToken !== null) {
                return res.status(401).json({
                    status: 401,
                    message: 'User is already logged in'
                });
            }
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '366d' }
        );

        await User.updateOne({ _id: user._id }, { $set: { isLoggedIn: true, authToken: token } });

        res.status(200).json({
            status: 200,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 500,
            message: 'Error during login',
            error: error.message
        });
    }
}

export const logOut = async (req, res) => {
    try {
        let userId = req?.body?.userId;

        if (!userId) {
            const JWT_SECRET = process.env.JWT_SECRET;
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded?.userId;
            }
        }

        if (!userId) {
            return res.status(400).json({
                status: 400,
                message: 'User ID is required for logout'
            });
        }

        let user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            });
        }

        if (user.role === "admin") {
            return res.status(200).json({
                status: 200,
                message: 'Admin logged out successfully'
            })
        }

        await User.updateOne({ _id: userId }, { $set: { isLoggedIn: false, authToken: null } });
        res.status(200).json({
            status: 200,
            message: 'User logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            status: 500,
            message: 'Error during logout',
            error: error.message
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 400,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // let mailData = await sendMail('manish.manker@pixelnx.com', token);

        // if (!mailData) {
        //     return res.status(500).json({
        //         status: 500,
        //         message: 'Error sending email'
        //     });
        // }

        await User.updateOne({ _id: user._id }, { $set: { resetToken: token } });

        res.status(200).json({
            status: 200,
            message: 'Password reset link sent to your email',
            token
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: "Error",
            message: 'Error resetting password',
            error: error.message
        });
    }
}

export const changePassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                status: 400,
                message: 'Password is required'
            });
        }

        const user = await User.findOne({ _id: req.user._id });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                status: 403,
                message: 'Admin password cannot be changed'
            });
        }

        if (await user.comparePassword(password)) {
            return res.status(400).json({
                status: 400,
                message: 'New password should be different from old password'
            });
        }

        user.password = password;
        await user.save();

        res.status(200).json({
            status: 200,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.log("Error", error);
        res.status(500).json({
            status: "Error",
            message: 'Error resetting password',
            error: error.message
        })
        return;

    }
}

export const resetPassword = async (req, res) => {
    try {
        const { password, token } = req.body;

        if (!password || !token) {
            return res.status(400).json({
                status: 400,
                message: 'Password and token are required'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(400).json({
                    status: 400,
                    message: 'Password reset link has expired'
                });
            } else {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid token'
                });
            }
        }

        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            });
        }

        if (user.resetToken !== token) {
            return res.status(400).json({
                status: 400,
                message: 'Password reset link has Used'
            });
        }

        if (await user.comparePassword(password)) {
            return res.status(400).json({
                status: 400,
                message: 'New password should be different from old password'
            });
        }

        user.password = password;
        await user.save();

        await User.updateOne({ _id: user._id }, { $set: { resetToken: null } });

        res.status(200).json({
            status: 200,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 500,
            message: 'Error resetting password',
            error: error.message
        });
    }
}



const sendMail = async (to, link) => {
    const mailHtml = `
        <div  style="margin: 50px auto 0; padding: 30px; background-color: #f5f5f5; font-family: Arial, sans-serif; width: fit-content; border-radius: 5px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 0; ">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0"
                        style="background-color: #ffffff; padding: 40px; text-align: center; border-radius: 5px;">
                        <!-- Logo -->
                        <tr>
                            <td style="padding-bottom: 30px;">
                                
                            </td>
                        </tr>
 
 
                        <tbody>
                            <tr>
                                <td>
                                    <h4 style="font-size:26px; font-weight:700; margin:0 0 10px; color:#444a64;">
                                        Password Reset</h4>
                                    <p style="font-size:17px; font-weight:400; margin:15px 40px 20px; color:#69767A; line-height: 24px;">If you’ve lost your password or wish to
                                        reset it, use the link below to get started.</p>
 
                                    <div> <a href="http://localhost:3000/resetPassword?${link}" target="_blank"
                                            style="display:inline-block; background:#ff9c4a; color:#fff; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold; font-size:16px;">Reset
                                            Your Password</a></div>
                                    <p style="font-size:15px; font-weight:400; color:#69767A; margin:20px 0 20px; line-height: 24px;">If
                                        you did not request a password
                                        reset, you can safely ignore this email. Only
                                        a person with access to your email can reset your account password.</p>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td
                                    style=" text-align:center; color:#444a64; font-size:14px; font-weight: 600; padding:15px 0px 0px ;">
                                    © 2025 PixaScore. All Rights Reserved.
                                </td>
                            </tr>
                        </tfoot>
 
 
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `;

    try {
        var transport = nodemailer.createTransport({
            host: process.env.MandrillHost,
            port: 587,
            secure: false,
            auth: {
                user: process.env.MandrillUser,
                pass: process.env.MandrillPass,
            },
        })
        const mailOptions = {
            from: 'support@pixascore.com',
            to: 'manish.manker@pixelnx.com',
            subject: "PixaScore Password Reset Link",
            html: mailHtml,
        };

        const info = await transport.sendMail(mailOptions);
        console.log('Email sent successfully:', info);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};