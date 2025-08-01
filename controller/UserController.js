
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendMail.js';

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
                message: 'User already exists'
            });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '366d' }
        );

        // let mailData = await sendEmail('verifyEmail', 'manish.manker@pixelnx.com', 'PixaScore Verify your email address', token);

        // if (!mailData) {
        //     return res.status(500).json({
        //         status: 500,
        //         message: 'Error sending email'
        //     });
        // }


        res.status(201).json({
            status: 201,
            message: 'Validation email sent successfully to your email address',
            token,
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

            if (user.isemailVerified === false) {
                return res.status(401).json({
                    status: 401,
                    message: 'Email is not verified. Check your email for verification link'
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


export const changeIsDemoCompleted = async (req, res) => {
    let userId = req.user._id;
    if (!userId) {
        console.log('User ID is required to update isDemoCompleted');
        res.status(400).json({
            status: 400,
            message: 'User ID is required to update isDemoCompleted'
        });
        return;
    }
    try {
        await User.updateOne({ _id: userId }, { $set: { isDemoCompleted: true } }).then(() => {
            res.status(200).json({
                status: 200,
                message: 'isDemoCompleted updated successfully'
            });
        }).catch((error) => {
            console.error('Error updating isDemoCompleted:', error);
            res.status(500).json({
                status: 500,
                message: 'Error updating isDemoCompleted',
                error: error.message
            });
        });

    } catch (error) {
        console.error('Error updating isDemoCompleted:', error);
        res.status(500).json({
            status: 500,
            message: 'Error updating isDemoCompleted',
            error: error.message
        });
    }
}

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

        // let mailData = await sendEmail('resetPassword','manish.manker@pixelnx.com','PixaScore Password Reset Link' , token);

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

        if (password) {
            if (await user.comparePassword(password)) {
                return res.status(400).json({
                    status: 400,
                    message: 'New password should be different from old password'
                });
            }
            user.password = password;
        }
        user.name = req.body?.fullname
        await user.save();

        res.status(200).json({
            status: 200,
            message: 'User Data changed successfully'
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

export const verifyEmail = async (req, res) => {
    try {
        const token = req.body?.token;

        if (!token) {
            return res.status(400).json({
                status: 400,
                message: 'Token is required'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(400).json({
                    status: 400,
                    message: 'Email verification link has expired'
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

        if (user.isemailVerified) {
            return res.status(202).json({
                status: 202,
                message: 'Email is already verified'
            });
        }


        const JWT_SECRET = process.env.JWT_SECRET;

        const sendToken = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '366d' }
        );

        await User.updateOne({ _id: user._id }, { $set: { isLoggedIn: true, authToken: sendToken, isemailVerified: true } });

        res.status(200).json({
            status: 200,
            message: 'Email verified successfully',
            token: sendToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log('Verify email error:', error);
        res.status(500).json({
            status: 500,
            message: 'Error verifying email',
            error: error.message
        });

    }
}

export const getactivePlan = async (req, res) => {
    try {
        let userId = req.user._id;

        let data = await User.findOne({ _id: userId });

        if (!data) {
            return res.status(404).json({
                status: 404,
                message: 'User not found'
            });
        }

        let activePlan = data.subscription?.plan || null;

        return res.status(200).json({
            status: 200,
            activePlan,
            message: 'Active plan fetched successfully',
            activePlan
        });

    } catch (error) {
        console.error('Get active plan error:', error);
        res.status(500).json({
            status: 500,
            message: 'Error fetching active plan',
            error: error.message
        });

    }
}




