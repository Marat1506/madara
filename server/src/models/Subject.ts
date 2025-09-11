import mongoose from 'mongoose';
import type { Subject } from '@shared/api';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  nameArabic: {
    type: String,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    enum: ['quran', 'hadith', 'fiqh', 'aqidah', 'arabic', 'other'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Transform output to match API interface
subjectSchema.methods.toJSON = function() {
  const subjectObject = this.toObject();
  const { _id, ...subject } = subjectObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...subject,
    createdAt: subjectObject.createdAt?.toISOString(),
    updatedAt: subjectObject.updatedAt?.toISOString()
  } as Subject;
};

export const SubjectModel = mongoose.model('Subject', subjectSchema);
export default SubjectModel;