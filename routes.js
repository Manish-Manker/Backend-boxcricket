import express from 'express';

const router = express.Router();
import { authenticateToken } from './middleware/auth.js';

import { login, signup, logOut, forgotPassword, resetPassword, changePassword, verifyEmail, changeIsDemoCompleted, getactivePlan } from './controller/UserController.js'
import {
    createMatch,
    getMatch,
    saveteamdata,
    getUserwiseMatch,
    savePlayerName,
    getPlayerName,
    changeStatus,
} from './controller/MatchController.js'

import { getAllUsers, activeInactiveUser, editUser, UserMatchData, TotalData, changeLoginStatus } from './controller/AdminController.js'

import { paymentRoutes } from './controller/subscription.js';

import { uploadLogo , getLogos, deleteLogo } from './controller/LogoUpload.js';
import { upload } from './middleware/uploadMiddleware.js';

// user routes
router.post('/signup', signup);

router.post('/login', login);

router.post('/logOut', logOut)

router.post('/forgotPassword', forgotPassword);

router.post('/resetPassword', resetPassword);

router.post('/verifyEmail', verifyEmail);

router.post('/changePassword', authenticateToken, changePassword);

router.post('/changeLoginStatus', authenticateToken, changeLoginStatus);

router.post('/changeIsDemoCompleted', authenticateToken, changeIsDemoCompleted);

// Match Routes
router.post('/match', authenticateToken, createMatch);


router.get('/match/:matchId', authenticateToken, getMatch);

router.post('/teamdata/:matchId', authenticateToken, saveteamdata);

router.get('/userwisematch', authenticateToken, getUserwiseMatch);

router.post('/playername', authenticateToken, savePlayerName);

router.get('/playername', authenticateToken, getPlayerName);

router.put('/chnageStatus', authenticateToken, changeStatus)

//admin routes

router.post('/getalluser', authenticateToken, getAllUsers);
router.post('/activeInactiveUser', authenticateToken, activeInactiveUser)
router.put('/edituser/:userId', authenticateToken, editUser)
router.post('/userwisematch/:userId', authenticateToken, UserMatchData)
router.get('/totalData', authenticateToken, TotalData)

router.post('/createSubscriptionSession', paymentRoutes);

router.get('/active_plan', authenticateToken, getactivePlan);

router.post('/upload', authenticateToken, upload, uploadLogo);
router.get('/getimages', authenticateToken, getLogos);
router.delete('/deleteImages', authenticateToken, deleteLogo);


export default router;