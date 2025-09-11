/**
 * MongoDB database operations for Islamic Education Management System
 * This provides database operations using MongoDB with Mongoose
 */

import mongoose from 'mongoose';
import {
  SchoolModel, TeacherModel, SubjectModel, ClassModel, StudentModel, 
  EnrollmentModel, ClassScheduleModel
} from './models';
import type {
  School, Teacher, Subject, Class, Student, Enrollment, ClassSchedule
} from '@shared/api';
import { connectToDatabase } from './config/database';
import { seedDatabase } from './utils/seedDatabase';

// Type for Mongoose document with toJSON method
type MongooseDocumentWithToJSON<T> = {
  toJSON(): T;
};

// =====================================
// Database Operations
// =====================================

export const database = {
  // Initialize with MongoDB connection and seed data
  async init() {
    await connectToDatabase();
    
    // Check if database is empty and seed if needed
    const schoolCount = await SchoolModel.countDocuments();
    if (schoolCount === 0) {
      console.log('🌱 Database is empty, seeding initial data...');
      await seedDatabase();
    }
    
    return this;
  },

  // Reset database
  async reset() {
    await Promise.all([
      SchoolModel.deleteMany({}),
      TeacherModel.deleteMany({}),
      SubjectModel.deleteMany({}),
      ClassModel.deleteMany({}),
      StudentModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      ClassScheduleModel.deleteMany({})
    ]);
    await seedDatabase();
  },

  // Generic CRUD operations
  async getAll<T>(table: string): Promise<T[]> {
    const Model = getModel(table);
    const documents = await Model.find({}).populate(getPopulateFields(table));
    return documents.map(doc => doc.toJSON()) as T[];
  },

  async getById<T>(table: string, id: string | number): Promise<T | undefined> {
    const Model = getModel(table);
    let query;
    
    if (mongoose.Types.ObjectId.isValid(id.toString())) {
      query = Model.findById(id);
    } else {
      // For backwards compatibility with integer IDs
      query = Model.findOne({});
    }
    
    const document = await query.populate(getPopulateFields(table));
    return document?.toJSON() as T;
  },

  async create<T extends { id?: number | string }>(table: string, item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const Model = getModel(table);
    const document = new Model(item);
    await document.save();
    return document.toJSON() as T;
  },

  async update<T extends { id: number | string }>(table: string, id: string | number, updates: Partial<T>): Promise<T | undefined> {
    const Model = getModel(table);
    let query;
    
    if (mongoose.Types.ObjectId.isValid(id.toString())) {
      query = { _id: id };
    } else {
      // For backwards compatibility
      const document = await Model.findOne({});
      if (!document) return undefined;
      query = { _id: document._id };
    }
    
    const document = await Model.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true }
    ).populate(getPopulateFields(table));
    
    return document?.toJSON() as T;
  },

  async delete(table: string, id: string | number): Promise<boolean> {
    const Model = getModel(table);
    let query;
    
    if (mongoose.Types.ObjectId.isValid(id.toString())) {
      query = { _id: id };
    } else {
      const document = await Model.findOne({});
      if (!document) return false;
      query = { _id: document._id };
    }
    
    const result = await Model.deleteOne(query);
    return result.deletedCount > 0;
  },

  // Specific queries
  async getStudentsByClassId(classId: string | number): Promise<Student[]> {
    const enrollments = await EnrollmentModel.find({ 
      classId: await getObjectId('classes', classId),
      status: 'active' 
    }).populate('studentId');
    
    return enrollments
      .map(e => e.studentId)
      .filter(Boolean)
      .map(student => (student as unknown as MongooseDocumentWithToJSON<Student>).toJSON());
  },

  async getClassesByStudentId(studentId: string | number): Promise<Class[]> {
    const enrollments = await EnrollmentModel.find({ 
      studentId: await getObjectId('students', studentId),
      status: 'active' 
    }).populate('classId');
    
    return enrollments
      .map(e => e.classId)
      .filter(Boolean)
      .map(cls => (cls as unknown as MongooseDocumentWithToJSON<Class>).toJSON());
  },

  async getClassesBySchoolId(schoolId: string | number): Promise<Class[]> {
    const classes = await ClassModel.find({ 
      schoolId: await getObjectId('schools', schoolId) 
    }).populate(['schoolId', 'teacherId', 'subjectIds', 'primarySubjectId']);
    
    return classes.map(cls => (cls as unknown as MongooseDocumentWithToJSON<Class>).toJSON());
  },

  async getTeachersBySchoolId(schoolId: string | number): Promise<Teacher[]> {
    const teachers = await TeacherModel.find({ 
      schoolIds: await getObjectId('schools', schoolId) 
    }).populate('schoolIds');
    
    return teachers.map(teacher => (teacher as unknown as MongooseDocumentWithToJSON<Teacher>).toJSON());
  },

  async getSchedulesByClassId(classId: string | number): Promise<ClassSchedule[]> {
    const schedules = await ClassScheduleModel.find({ 
      classId: await getObjectId('classes', classId) 
    }).populate(['classId', 'subjectId']);
    
    return schedules.map(schedule => (schedule as unknown as MongooseDocumentWithToJSON<ClassSchedule>).toJSON());
  },

  async getEnrollmentsByStudentId(studentId: string | number): Promise<Enrollment[]> {
    const enrollments = await EnrollmentModel.find({ 
      studentId: await getObjectId('students', studentId) 
    }).populate(['studentId', 'classId']);
    
    return enrollments.map(enrollment => (enrollment as unknown as MongooseDocumentWithToJSON<Enrollment>).toJSON());
  },

  async getEnrollmentsByClassId(classId: string | number): Promise<Enrollment[]> {
    const enrollments = await EnrollmentModel.find({ 
      classId: await getObjectId('classes', classId) 
    }).populate(['studentId', 'classId']);
    
    return enrollments.map(enrollment => (enrollment as unknown as MongooseDocumentWithToJSON<Enrollment>).toJSON());
  },

  // Update student count in class
  async updateClassStudentCount(classId: string | number): Promise<void> {
    const activeEnrollments = await EnrollmentModel.countDocuments({
      classId: await getObjectId('classes', classId),
      status: 'active'
    });
    
    await ClassModel.findByIdAndUpdate(
      await getObjectId('classes', classId),
      { currentStudents: activeEnrollments }
    );
  },

  // Search functionality
  async searchStudents(query: string): Promise<Student[]> {
    const regex = new RegExp(query, 'i');
    const students = await StudentModel.find({
      $or: [
        { name: regex },
        { fullName: regex }
      ]
    });
    
    return students.map(student => (student as unknown as MongooseDocumentWithToJSON<Student>).toJSON());
  },

  async searchClasses(query: string): Promise<Class[]> {
    const regex = new RegExp(query, 'i');
    const classes = await ClassModel.find({
      name: regex
    }).populate(['schoolId', 'teacherId', 'subjectIds', 'primarySubjectId']);
    
    return classes.map(cls => (cls as unknown as MongooseDocumentWithToJSON<Class>).toJSON());
  },

  async searchTeachers(query: string): Promise<Teacher[]> {
    const regex = new RegExp(query, 'i');
    const teachers = await TeacherModel.find({
      name: regex
    }).populate('schoolIds');
    
    return teachers.map(teacher => (teacher as unknown as MongooseDocumentWithToJSON<Teacher>).toJSON());
  }
};

// Helper functions
function getModel(table: string) {
  const models: Record<string, any> = {
    'schools': SchoolModel,
    'teachers': TeacherModel,
    'subjects': SubjectModel,
    'classes': ClassModel,
    'students': StudentModel,
    'enrollments': EnrollmentModel,
    'schedules': ClassScheduleModel
  };
  
  const model = models[table];
  if (!model) {
    throw new Error(`Unknown table: ${table}`);
  }
  return model;
}

function getPopulateFields(table: string): string[] {
  const populateMap: Record<string, string[]> = {
    'classes': ['schoolId', 'teacherId', 'subjectIds', 'primarySubjectId'],
    'teachers': ['schoolIds'],
    'enrollments': ['studentId', 'classId'],
    'schedules': ['classId', 'subjectId']
  };
  
  return populateMap[table] || [];
}

async function getObjectId(table: string, id: string | number): Promise<mongoose.Types.ObjectId> {
  if (mongoose.Types.ObjectId.isValid(id.toString())) {
    return new mongoose.Types.ObjectId(id.toString());
  }
  
  // For backwards compatibility, find first document
  const Model = getModel(table);
  const document = await Model.findOne({});
  if (!document) {
    throw new Error(`No documents found in ${table}`);
  }
  return document._id;
}