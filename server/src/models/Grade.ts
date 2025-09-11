import mongoose from 'mongoose';
import type { Grade } from '@shared/api';

const gradeSchema = new mongoose.Schema({
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
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['exam', 'quiz', 'homework', 'project', 'participation'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  versionKey: false
});

// Validate score is not greater than maxScore
gradeSchema.pre('save', function(next) {
  if (this.score > this.maxScore) {
    next(new Error('Score cannot be greater than maximum score'));
  } else {
    next();
  }
});

// Transform output to match API interface
gradeSchema.methods.toJSON = function() {
  const gradeObject = this.toObject();
  const { _id, ...grade } = gradeObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...grade,
    date: grade.date?.toISOString().split('T')[0],
    createdAt: gradeObject.createdAt?.toISOString(),
    updatedAt: gradeObject.updatedAt?.toISOString()
  } as Grade;
};

export const GradeModel = mongoose.model('Grade', gradeSchema);
export default GradeModel;