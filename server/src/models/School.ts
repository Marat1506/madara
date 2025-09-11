import mongoose from 'mongoose';
import type { School } from '@shared/api';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['madrasa', 'islamic_school', 'regular_school'],
    required: true
  },
  foundedYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear()
  },
  languages: [{
    type: String,
    trim: true
  }],
  address: {
    type: String,
    trim: true,
    maxlength: 500
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
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
  }
}, {
  timestamps: true,
  versionKey: false
});

// Transform output to match API interface
schoolSchema.methods.toJSON = function() {
  const schoolObject = this.toObject();
  const { _id, ...school } = schoolObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16), // Convert ObjectId to integer for API compatibility
    ...school,
    createdAt: schoolObject.createdAt?.toISOString(),
    updatedAt: schoolObject.updatedAt?.toISOString()
  } as School;
};

export const SchoolModel = mongoose.model('School', schoolSchema);
export default SchoolModel;