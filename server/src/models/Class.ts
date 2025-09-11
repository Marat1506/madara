import mongoose from 'mongoose';
import type { Class } from '@shared/api';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  subjectIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }],
  primarySubjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    max: 200
  },
  currentStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  academicYear: {
    type: String,
    required: true
  },
  schedule: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    startTime: String,
    endTime: String,
    room: String
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Transform output to match API interface
classSchema.methods.toJSON = function() {
  const classObject = this.toObject();
  const { _id, ...classData } = classObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...classData,
    createdAt: classObject.createdAt?.toISOString(),
    updatedAt: classObject.updatedAt?.toISOString()
  } as Class;
};

export const ClassModel = mongoose.model('Class', classSchema);
export default ClassModel;