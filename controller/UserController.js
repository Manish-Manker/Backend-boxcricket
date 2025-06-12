
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


export const signup = async (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET ;
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
    const JWT_SECRET = process.env.JWT_SECRET ;    

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

        if(user.status === "inactive") {
            return res.status(401).json({
                status: 401,
                message: 'User is inactive'
            });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '366d' }
        );

        res.status(200).json({
            status: 200,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role:user.role
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

