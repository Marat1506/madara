import mongoose from 'mongoose';
import type { Teacher } from '@shared/api';

const teacherSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  subjects: [{
    type: String,
    trim: true
  }],
  schoolIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  }],
  qualifications: [{
    type: String,
    trim: true
  }],
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Transform output to match API interface
teacherSchema.methods.toJSON = function() {
  const teacherObject = this.toObject();
  const { _id, ...teacher } = teacherObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...teacher,
    joinDate: teacher.joinDate?.toISOString().split('T')[0],
    createdAt: teacherObject.createdAt?.toISOString(),
    updatedAt: teacherObject.updatedAt?.toISOString()
  } as Teacher;
};

export const TeacherModel = mongoose.model('Teacher', teacherSchema);
export default TeacherModel;