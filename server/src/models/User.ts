import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { User } from '@shared/api';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'teacher'],
    required: true,
    default: 'teacher'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        return !email || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  schoolIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  }],
  permissions: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output to match API interface
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  const { _id, password, ...user } = userObject;
  
  return {
    id: _id.toString(),
    ...user,
    createdAt: userObject.createdAt?.toISOString(),
    updatedAt: userObject.updatedAt?.toISOString()
  } as User;
};

export const UserModel = mongoose.model('User', userSchema);
export default UserModel;