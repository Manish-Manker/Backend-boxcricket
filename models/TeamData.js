import mongoose from 'mongoose';

const overSchema = new mongoose.Schema({
  bowlerNum: Number,
  bowlerName: String,
  balls: [String],
  extraBalls: [String],
  extraRuns: [String],
  overTotal: String
});

const batsmanSchema = new mongoose.Schema({
  name: String,
  overs: [overSchema]
});

const pairSchema = new mongoose.Schema({
  pairId: Number,
  batsmen: [batsmanSchema],
  totals: [String]
});

const teamDataSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  teamNumber: {
    type: Number,
    enum: [1, 2]
  },  data: [pairSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('TeamData', teamDataSchema);