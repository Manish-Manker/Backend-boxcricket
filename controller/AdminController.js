
import Match from "../models/Match.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        let page = req?.body?.page || 1;
        let perPage = req?.body?.perPage || 10;
        let status = req?.body?.status;
        let search = req?.body?.search;

        let skip = (page - 1) * perPage;
        let limit = perPage;

        let where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.$or = [
                { name: { $regex: search, $options: "i" } }
            ];
        }

        let totalUsers = await User.countDocuments({ role: "user", ...where });

        const users = await User.find({ role: "user", ...where }).sort({ createdAt: -1 }).skip(skip).limit(limit);

        let data = await Promise.all(users.map(async (user) => {
            const matchCount = await Match.countDocuments({ userId: user._id });

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                emailVerified: user?.isemailVerified,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                isLoggedIn: user?.isLoggedIn,
                matchCount
            };
        }));

        res.status(200).json({
            status: 200,
            message: "Users fetched successfully",
            data: data,
            totalUsers
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            status: 500,
            message: "Error fetching users",
            error: error.message
        });
    }
};

export const editUser = async (req, res) => {
    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        const { userId } = req.params;
        const { name, email } = req.body;

        let password = req.body?.password;

        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found:", userId);
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        let updateData = {};
        updateData.name = name;
        // updateData.email = email;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 8);
            updateData.password = hashedPassword;
        }

        let data = await User.updateOne({ _id: userId }, { $set: updateData });

        // if (data.modifiedCount === 0) {
        //     return res.status(400).json({
        //         status: 400,
        //         message: "User not edited"
        //     });
        // } else {
        //     res.status(200).json({
        //         status: 200,
        //         message: "User edited successfully"
        //     });

        return res.status(200).json({
            status: 200,
            message: "User edited successfully",
            data
        });

    } catch (error) {
        console.log("Error editing user:", error);
        return res.status(500).json({
            status: 500,
            message: "Error editing user",
            error: error.message
        });

    }
}

export const activeInactiveUser = async (req, res) => {
    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        const { userId, status } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        user.status = status;
        await user.save();

        res.json({
            status: 200,
            message: "User status updated successfully"
        });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({
            status: 500,
            message: "Error updating user status",
            error: error.message
        });
    }
};

export const changeLoginStatus = async (req, res) => {
    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        const { userId, isLoggedIn } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        user.isLoggedIn = false;
        user.authToken = null;
        await user.save();

        res.json({
            status: 200,
            message: "User login status updated successfully"
        });
    } catch (error) {
        console.error("Error updating user login status:", error);
        res.status(500).json({
            status: 500,
            message: "Error updating user login status",
            error: error.message
        });
    }
};

export const UserMatchData = async (req, res) => {
    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        let userId = req?.params?.userId;

        if (!userId) {
            return res.status(400).json({
                status: 400,
                message: "User ID is required"
            });
        }

        let page = req?.body?.page || 1;
        let perPage = req?.body?.perPage || 10;

        let skip = (page - 1) * perPage;
        let limit = perPage;

        let status = req?.body?.status

        let where = {}

        if (status) {
            where.status = status
        }

        let totalData = await Match.countDocuments({ userId, ...where });

        const userMatches = await Match.find({ userId, ...where }).sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.json({
            status: 200,
            message: "User-wise matches fetched successfully",
            data: userMatches,
            totalData
        });
    } catch (error) {
        console.error("Error fetching user-wise matches:", error);
        res.status(500).json({
            status: 500,
            message: "Error fetching user-wise matches",
            error: error.message
        });
    }
}

export const TotalData = async (req, res) => {

    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        let totalUsers;
        let ActiveUsers;
        let InActiveUsers;
        let TotalMatches;
        let LogedInUsers;

        totalUsers = await User.countDocuments({ _id: { $ne: req.user._id } });
        ActiveUsers = await User.countDocuments({ status: "active", _id: { $ne: req.user._id } });
        InActiveUsers = await User.countDocuments({ status: "inactive", _id: { $ne: req.user._id } });
        TotalMatches = await Match.countDocuments({ userId: { $ne: req.user._id } });
        LogedInUsers = await User.countDocuments({ isLoggedIn: true, _id: { $ne: req.user._id } });

        res.json({
            status: 200,
            message: "User-wise matches fetched successfully",
            data: {
                totalUsers,
                ActiveUsers,
                InActiveUsers,
                TotalMatches,
                LogedInUsers
            }
        });


    } catch (error) {
        console.error("Error fetching user-wise matches:", error);
        res.status(500).json({
            status: 500,
            message: "Error fetching user-wise matches",
            error: error.message
        });
    }

}