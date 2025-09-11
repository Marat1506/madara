import mongoose from 'mongoose';
import type { Student } from '@shared/api';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  parentName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  parentPhone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  parentEmail: {
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
  address: {
    type: String,
    trim: true,
    maxlength: 500
  },
  enrollmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Transform output to match API interface
studentSchema.methods.toJSON = function() {
  const studentObject = this.toObject();
  const { _id, ...student } = studentObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...student,
    dateOfBirth: student.dateOfBirth?.toISOString().split('T')[0],
    enrollmentDate: student.enrollmentDate?.toISOString().split('T')[0],
    createdAt: studentObject.createdAt?.toISOString(),
    updatedAt: studentObject.updatedAt?.toISOString()
  } as Student;
};

export const StudentModel = mongoose.model('Student', studentSchema);
export default StudentModel;