import express from 'express';

const router = express.Router();
import { authenticateToken } from './controller/auth.js';

import { login, signup } from './controller/UserController.js'
import {
    createMatch,
    getMatch,
    saveteamdata,
    getUserwiseMatch,
    savePlayerName,
    getPlayerName,
    changeStatus
} from './controller/MatchController.js'

import { getAllUsers, activeInactiveUser, editUser } from './controller/AdminController.js'

// user routes
router.post('/signup', signup);

router.post('/login', login);

// Match Routes
router.post('/match', authenticateToken, createMatch);

router.get('/match/:matchId', authenticateToken, getMatch);

router.post('/teamdata/:matchId', authenticateToken, saveteamdata);

router.get('/userwisematch', authenticateToken, getUserwiseMatch);

router.post('/playername', authenticateToken, savePlayerName);

router.get('/playername', authenticateToken, getPlayerName);

router.put('/chnageStatus', authenticateToken, changeStatus)

//admin routes

router.get('/getalluser', authenticateToken, getAllUsers);
router.post('/activeInactiveUser', authenticateToken, activeInactiveUser)
router.put('/edituser/:userId', authenticateToken, editUser)

export default router;