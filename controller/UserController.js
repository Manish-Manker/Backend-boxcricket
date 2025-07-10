
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


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