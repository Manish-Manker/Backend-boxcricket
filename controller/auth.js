
import User from '../models/User.js';
import jwt from 'jsonwebtoken';


export const authenticateToken = async (req, res, next) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.log("Token not found in request headers");
            return res.status(401).json({
                status: 401,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            console.log("User not found for the provided token:");
            return res.status(401).json({
                status: 401,
                message: 'User not found'
            });
        }


        if (user.status === "inactive") {
            console.log("User is inactive:");
            return res.status(200).json({
                status: 401,
                message: 'User is inactive'
            });
        }

        if (user.role !== "admin") {
            if (user.isLoggedIn === false || user.authToken !== token) {
                console.log("User is logged out or token does not match:");
                return res.status(200).json({
                    status: 401,
                    message: 'User is logged out'
                });
            }

            if (user.isemailVerified === false) {
                console.log("Email is not verified for user:");
                return res.status(401).json({
                    status: 401,
                    message: 'Email is not verified. Check your email for verification link'
                });
            }

            if (user.isDemoCompleted === true) {
                console.log("Demo is already completed for user:");
                
                if (
                    user?.subscription &&
                    user?.subscription.status === "paid" &&
                    (user?.subscription.amount == 9.99 || user?.subscription.amount == 19.99)
                ) {
                    // Continue as user has a valid paid plan
                    console.log("User has a valid paid plan. Proceeding with request.");
                    
                } else {
                    console.log("Demo is already completed. Please purchase the plan to continue.");
                    return res.status(200).json({
                        status: 301,
                        message: 'Demo is already completed. Please purchase the plan to continue'
                    });
                }
            }

        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Error in authenticateToken middleware:", error);
        return res.status(403).json({
            status: 403,
            message: 'Invalid or expired token'
        });
    }
};