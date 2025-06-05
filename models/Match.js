import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team1: String,
  team2: String,
  totalOvers: Number,
  oversPerSkin: Number,
  status: {
    type: String,
    enum: ['ongoing', 'completed','cancel'],
    default: 'ongoing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Match', matchSchema);