import mongoose from 'mongoose';
import type { ClassSchedule } from '@shared/api';

const classScheduleSchema = new mongoose.Schema({
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
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(time: string) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(time: string) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  room: {
    type: String,
    trim: true,
    maxlength: 50
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create compound index to prevent scheduling conflicts
classScheduleSchema.index({ classId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });

// Transform output to match API interface
classScheduleSchema.methods.toJSON = function() {
  const scheduleObject = this.toObject();
  const { _id, ...schedule } = scheduleObject;
  
  return {
    id: parseInt(_id.toString().slice(-8), 16),
    ...schedule
  } as ClassSchedule;
};

export const ClassScheduleModel = mongoose.model('ClassSchedule', classScheduleSchema);
export default ClassScheduleModel;