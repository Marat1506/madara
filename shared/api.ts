/**
 * Shared code between client and server
 * Data models and API types for Islamic Education Management System
 */

// =====================================
// Core Data Models
// =====================================

export interface School {
  id: number;
  name: string;
  type: "madrasa" | "islamic_school" | "regular_school";
  foundedYear: number;
  languages: string[];
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  subjects: string[];
  schoolIds: number[];
  qualifications?: string[];
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  name: string;
  nameArabic?: string;
  category: "quran" | "hadith" | "fiqh" | "aqidah" | "arabic" | "other";
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: number;
  name: string;
  schoolId: number;
  teacherId?: number;
  subjectIds: number[];
  primarySubjectId?: number;
  maxStudents: number;
  currentStudents: number;
  academicYear: string;
  schedule?: ClassSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: number;
  classId: number;
  subjectId: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  room?: string;
}

export interface Student {
  id: number;
  name: string;
  fullName: string;
  dateOfBirth?: string;
  gender: "male" | "female";
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  enrollmentDate: string;
  academicYear: string;
  level: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  classId: number;
  enrollmentDate: string;
  status: "active" | "inactive" | "transferred" | "graduated";
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: number;
  studentId: number;
  classId: number;
  subjectId: number;
  assessmentType: "exam" | "quiz" | "homework" | "project" | "participation";
  score: number;
  maxScore: number;
  date: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// API Request/Response Types
// =====================================

// Demo endpoint
export interface DemoResponse {
  message: string;
}

// Schools API
export interface CreateSchoolRequest {
  name: string;
  type: School["type"];
  foundedYear: number;
  languages: string[];
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateSchoolRequest extends Partial<CreateSchoolRequest> {}

export interface SchoolResponse extends School {
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
}

export interface SchoolsListResponse {
  schools: SchoolResponse[];
  total: number;
}

// Teachers API
export interface CreateTeacherRequest {
  name: string;
  email?: string;
  phone?: string;
  subjects: string[];
  schoolIds: number[];
  qualifications?: string[];
  joinDate?: string;
}

export interface UpdateTeacherRequest extends Partial<CreateTeacherRequest> {}

export interface TeacherResponse extends Teacher {
  schools: Pick<School, "id" | "name">[];
  classesCount: number;
  studentsCount: number;
}

export interface TeachersListResponse {
  teachers: TeacherResponse[];
  total: number;
}

// Subjects API
export interface CreateSubjectRequest {
  name: string;
  nameArabic?: string;
  category: Subject["category"];
  description?: string;
  level: Subject["level"];
}

export interface UpdateSubjectRequest extends Partial<CreateSubjectRequest> {}

export interface SubjectsListResponse {
  subjects: Subject[];
  total: number;
}

// Classes API
export interface CreateClassRequest {
  name: string;
  schoolId: number;
  teacherId?: number;
  subjectIds: number[];
  primarySubjectId?: number;
  maxStudents: number;
  academicYear: string;
  schedule?: Omit<ClassSchedule, "id" | "classId">[];
}

export interface UpdateClassRequest extends Partial<CreateClassRequest> {}

export interface ClassResponse extends Class {
  school: Pick<School, "id" | "name">;
  teacher?: Pick<Teacher, "id" | "name">;
  subjects: Pick<Subject, "id" | "name" | "nameArabic">[];
  primarySubject?: Pick<Subject, "id" | "name" | "nameArabic">;
  students: Pick<Student, "id" | "name" | "fullName">[];
  schedule: ClassSchedule[];
}

export interface ClassesListResponse {
  classes: ClassResponse[];
  total: number;
}

// Students API
export interface CreateStudentRequest {
  name: string;
  fullName: string;
  dateOfBirth?: string;
  gender: Student["gender"];
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  enrollmentDate: string;
  academicYear: string;
  level: string;
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {}

export interface StudentResponse extends Student {
  enrollments: {
    id: number;
    class: Pick<Class, "id" | "name">;
    school: Pick<School, "id" | "name">;
    status: Enrollment["status"];
    enrollmentDate: string;
  }[];
  currentClasses: Pick<Class, "id" | "name">[];
}

export interface StudentsListResponse {
  students: StudentResponse[];
  total: number;
}

// Enrollments API
export interface CreateEnrollmentRequest {
  studentId: number;
  classId: number;
  enrollmentDate: string;
  academicYear: string;
}

export interface UpdateEnrollmentRequest {
  status: Enrollment["status"];
}

export interface EnrollmentResponse extends Enrollment {
  student: Pick<Student, "id" | "name" | "fullName">;
  class: Pick<Class, "id" | "name">;
  school: Pick<School, "id" | "name">;
}

export interface EnrollmentsListResponse {
  enrollments: EnrollmentResponse[];
  total: number;
}

// Dashboard/Analytics API
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSchools: number;
  activeEnrollments: number;
  studentsPerSchool: { schoolName: string; count: number }[];
  studentsPerClass: { className: string; count: number }[];
  subjectDistribution: { subjectName: string; count: number }[];
  enrollmentTrends: { month: string; enrollments: number }[];
  genderDistribution: { male: number; female: number };
  recentEnrollments: {
    id: number;
    studentName: string;
    className: string;
    schoolName: string;
    date: string;
  }[];
}

// Schedule API
export interface ScheduleResponse {
  classId: number;
  className: string;
  school: Pick<School, "id" | "name">;
  teacher: Pick<Teacher, "id" | "name">;
  schedule: ClassSchedule[];
  students: Pick<Student, "id" | "name">[];
}

export interface WeeklyScheduleResponse {
  schedule: ScheduleResponse[];
  dayNames: string[];
}

// Grades API
export interface CreateGradeRequest {
  studentId: number;
  classId: number;
  subjectId: number;
  assessmentType: Grade["assessmentType"];
  score: number;
  maxScore: number;
  date: string;
  comments?: string;
}

export interface UpdateGradeRequest extends Partial<CreateGradeRequest> {}

export interface GradeResponse extends Grade {
  student: Pick<Student, "id" | "name" | "fullName">;
  class: Pick<Class, "id" | "name">;
  subject: Pick<Subject, "id" | "name" | "nameArabic">;
}

export interface GradesListResponse {
  grades: GradeResponse[];
  total: number;
}

// =====================================
// Authentication Types
// =====================================

export interface User {
  id: string;
  username: string;
  role: "admin" | "teacher";
  name: string;
  email?: string;
  schoolIds: number[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: "admin" | "teacher";
  name: string;
  email?: string;
  schoolIds: number[];
  permissions?: string[];
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: "admin" | "teacher";
  name?: string;
  email?: string;
  schoolIds?: number[];
  permissions?: string[];
}

export interface UserResponse extends User {
  hasAccount: boolean;
}

export interface UsersListResponse {
  users: UserResponse[];
  total: number;
}

// =====================================
// Common API Types
// =====================================

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================
// Predefined Islamic Subjects
// =====================================

export const ISLAMIC_SUBJECTS = [
  { name: "Quran", nameArabic: "القرآن الكريم", category: "quran" as const },
  { name: "Namaz", nameArabic: "الصلاة", category: "fiqh" as const },
  { name: "Tajweed", nameArabic: "التجويد", category: "quran" as const },
  { name: "Hadith", nameArabic: "الحديث الشريف", category: "hadith" as const },
  { name: "Muallim Sani", nameArabic: "المعلم الثاني", category: "arabic" as const },
  { name: "Fundamentals of Religion", nameArabic: "أصول الدين", category: "aqidah" as const },
  { name: "Duas & Azkar", nameArabic: "الأدعية والأذكار", category: "other" as const },
  { name: "Alif-Ba", nameArabic: "ألف با", category: "arabic" as const },
  { name: "Tabarak Juz", nameArabic: "جزء تبارك", category: "quran" as const },
  { name: "Amma Juz", nameArabic: "جزء عم", category: "quran" as const },
  { name: "Fiqh", nameArabic: "الفقه", category: "fiqh" as const },
  { name: "Aqidah", nameArabic: "العقيدة", category: "aqidah" as const },
  { name: "Islamic History", nameArabic: "التاريخ الإسلامي", category: "other" as const },
  { name: "Arabic Grammar", nameArabic: "النحو العربي", category: "arabic" as const },
  { name: "Seerah", nameArabic: "السيرة النبوية", category: "other" as const }
] as const;
