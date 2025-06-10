
import Match from "../models/Match.js";
import User from "../models/User.js";


export const getAllUsers = async (req, res) => {
    try {
        let admin = req.user.role;

        if (admin !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "You are not authorized to access this resource"
            });
        }

        let page  = req?.body?.page || 1;
        let perPage = req?.body?.perPage || 10;

        let skip = (page - 1) * perPage;
        let limit = perPage;
        
        let totalUsers = await User.countDocuments({ role: "user" });

        const users = await User.find({ role: "user" }).sort({ createdAt: -1 }).skip(skip).limit(limit);

        let data = await Promise.all(users.map(async (user) => {
            const matchCount = await Match.countDocuments({ userId: user._id });

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        let data = await User.updateOne({ _id: userId }, { $set: { name, email } });

        if (data.modifiedCount === 0) {
            return res.status(400).json({
                status: 400,
                message: "User not edited"
            });
        } else {
            res.status(200).json({
                status: 200,
                message: "User edited successfully"
            });
        }




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

        let totalData = await Match.countDocuments({ userId });

        const userMatches = await Match.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);

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