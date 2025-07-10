
import User from '../models/User.js';
import jwt from 'jsonwebtoken';


export const authenticateToken = async (req, res, next) => {
    const JWT_SECRET = process.env.JWT_SECRET ;
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 401,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                status: 401,
                message: 'User not found'
            });
        }

        req.user = user;

        if(user.status === "inactive") {
            return res.status(200).json({
                status: 401,
                message: 'User is inactive'
            });
        }

        if(user.role !== "admin") {
            
            if(user.isLoggedIn === false || user.authToken !== token) {
                return res.status(200).json({
                    status: 401,
                    message: 'User is logged out'
                });
            }
        }

        next();
    } catch (error) {
        return res.status(403).json({
            status: 403,
            message: 'Invalid or expired token'
        });
    }
};