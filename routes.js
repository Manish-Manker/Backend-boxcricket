import express from 'express';
import jwt from 'jsonwebtoken';
import Match from './models/Match.js';
import TeamData from './models/TeamData.js';
import User from './models/User.js';
import PlayerName from './models/PlayerName.js';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
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
        next();
    } catch (error) {
        return res.status(403).json({ 
            status: 403, 
            message: 'Invalid or expired token'
        });
    }
};

// Authentication Routes
router.post('/signup', async (req, res) => {
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
});

router.post('/login', async (req, res) => {
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

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 200,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
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
});

// Match Routes
router.post('/match', authenticateToken, async (req, res) => {
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
});

router.get('/match/:matchId', authenticateToken, async (req, res) => {
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
});

// Team Data Routes
router.post('/teamdata/:matchId', authenticateToken, async (req, res) => {
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
});

router.get('/userwisematch', authenticateToken, async (req, res) => {
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
});

router.post('/playername', authenticateToken, async (req, res) => {
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
        }else{
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
}); 

router.get('/playername', authenticateToken, async (req, res) => {
    try {
        let userId = req.user._id;
        const playerNames = await PlayerName.findOne({ userId });
        
        console.log(playerNames);
        
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
});

export default router;