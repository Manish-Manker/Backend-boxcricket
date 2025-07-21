import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  isemailVerified: {
    type: Boolean,
    default: false
  },
  isDemoCompleted: {
    type: Boolean,
    default: false
  },
  authToken: {
    type: String,
    default: null
  },
  resetToken: {
    type: String,
    default: null
  },
  subscription: {
    id: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    plan: {
      type: String,
      default: null
    },
    amount: {
      type: String,
      default: null
    },
    currency: {
      type: String,
      default: null
    },
    createdAt: String,
    expiresAt: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
