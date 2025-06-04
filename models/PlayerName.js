import mongoose from 'mongoose';

const playerNameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    playerName: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }, updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('PlayerName', playerNameSchema);