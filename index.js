import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import * as dotenv from 'dotenv';
import routes from './routes.js';

import morgan from "morgan";
import moment from 'moment-timezone'; 

dotenv.config();

const app = express();

morgan.token('date', function () {
    return moment().tz('Asia/Kolkata').format('DD/MMM/YYYY:hh:mm:ss A ZZ');
});
app.use(morgan(':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
try {
    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: 'pixascore', 
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
} catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
}

// Routes
app.use('/api', routes);

// Global error handling middleware 
app.use((err, req, res, next) => {
    console.log("globel error----------------");
    console.error('Error occurred:', err);
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message || 'Internal Server Error',
        details: err.details || 'An unexpected error occurred.'
    });
    return;
});

// Catch 404 errors for any undefined routes
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: 'Route not found. Please check the URL and try again.',
        data: null
    });
    return;
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});