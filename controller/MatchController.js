
import Match from '../models/Match.js';
import TeamData from '../models/TeamData.js';

import PlayerName from '../models/PlayerName.js';

export const createMatch = async (req, res) => {
    try {
        const match = new Match({
            ...req.body,
            userId: req.user._id
        });

        await match.save();
        res.status(201).json({
            status: 201,
            message: "Match created successfully",
            data: match
        });
    } catch (error) {
        console.error("Match creation error:", error);
        res.status(400).json({
            status: 400,
            message: "Match creation failed",
            error: error.message
        });
    }
}

export const getMatch = async (req, res) => {
    try {
        const { matchId } = req.params;

        if (!matchId) {
            return res.status(400).json({
                status: 400,
                message: "Match ID is required"
            });
        }

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({
                status: 404,
                message: "Match not found"
            });
        }

        const team1Data = await TeamData.findOne({ matchId, teamNumber: 1 });
        const team2Data = await TeamData.findOne({ matchId, teamNumber: 2 });

        res.json({
            status: 200,
            message: "Match data fetched successfully",
            data: {
                matchInfo: match,
                team1Data: team1Data?.data || [],
                team2Data: team2Data?.data || []
            }
        });
    } catch (error) {
        console.error("Error fetching match:", error);
        res.status(500).json({
            status: 500,
            message: "Error fetching match data",
            error: error.message
        });
    }
}

export const saveteamdata = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { teamNumber, data } = req.body;

        if (!matchId || !teamNumber || !data) {
            return res.status(400).json({
                status: 400,
                message: "Match ID, Team Number and Data are required"
            });
        }

        let teamData = await TeamData.findOne({ matchId, teamNumber });
        if (!teamData) {
            teamData = new TeamData({
                matchId,
                teamNumber,
                data,
                userId: req.user._id  // Associate team data with user
            });
        } else {
            teamData.data = data;
            teamData.lastUpdated = Date.now();
        }

        await teamData.save();
        res.json({
            status: 200,
            message: "Team data updated successfully",
            data: teamData
        });
    } catch (error) {
        console.error("Team data update error:", error);
        res.status(500).json({
            status: 500,
            message: "Team data update failed",
            error: error.message
        });
    }
}


export const getUserwiseMatch = async (req, res) => {
    try {
        const userId = req.user._id;
        const userMatches = await Match.find({ userId }).sort({ createdAt: -1 });
        res.json({
            status: 200,
            message: "User-wise matches fetched successfully",
            data: userMatches
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

export const savePlayerName = async (req, res) => {

    try {
        let userId = req.user._id;
        let newPlayerName = req.body.playerNames;

        const playerNames = await PlayerName.findOne({ userId });

        if (!playerNames) {
            let NewplayerName = new PlayerName({
                userId,
                playerName: [newPlayerName]
            });
            await NewplayerName.save();
        } else {
            playerNames.playerName.push(newPlayerName);
            await playerNames.save();
        }

        res.json({
            status: 200,
            message: "Player names saved successfully"
        });
    } catch (error) {
        console.error("Error saving player names:", error);
        res.status(500).json({
            status: 500,
            message: "Error saving player names",
            error: error.message
        });
    }
}

export const getPlayerName = async (req, res) => {
    try {
        let userId = req.user._id;
        const playerNames = await PlayerName.findOne({ userId });

        let data = playerNames?.playerName || [];
        res.json({
            status: 200,
            message: "Player names fetched successfully",
            data
        });
    } catch (error) {
        console.error("Error fetching player names:", error);
        res.status(500).json({
            status: 500,
            message: "Error fetching player names",
            error: error.message
        });
    }
}

export const changeStatus = async (req, res) => {
    try {
        let userId = req.user._id;
        let status = req.body.status;
        let matchId = req.body.matchId;

        let match = await Match.findOne({ userId, _id: matchId });
        if (match && match.status) {
            match.status = status;

            await match.save();
            let data = await Match.findOne({ userId });

            res.status(200).json({
                status: 200,
                message: "Status changed successfully"
            });
        } else {
            res.status(404).json({
                status: 404,
                message: "Match not found"
            });
        }

    } catch (error) {
        console.error("Error :", error);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
}