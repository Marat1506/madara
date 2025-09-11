import mongoose from 'mongoose';
import type { Enrollment } from '@shared/api';

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  enrollmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated'],
    default: 'active'
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create compound index to ensure a student can only have one active enrollment per class
enrollmentSchema.index({ studentId: 1, classId: 1, status: 1 }, { unique: true });

// Transform output to match API interface
enrollmentSchema.methods.toJSON = function() {
  const enrollmentObject = this.toObject();
  const { _id, ...enrollment } = enrollmentObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...enrollment,
    enrollmentDate: enrollment.enrollmentDate?.toISOString().split('T')[0],
    createdAt: enrollmentObject.createdAt?.toISOString(),
    updatedAt: enrollmentObject.updatedAt?.toISOString()
  } as Enrollment;
};

export const EnrollmentModel = mongoose.model('Enrollment', enrollmentSchema);
export default EnrollmentModel;