import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentResponse,
  StudentsListResponse,
  PaginationParams,
  ApiResponse,
  Student,
  Class,
  School,
  Enrollment
} from "@shared/api";

// =====================================
// Validation Schemas
// =====================================

const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  fullName: z.string().min(1, "Full name is required").max(200),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]),
  parentName: z.string().max(200).optional(),
  parentPhone: z.string().max(20).optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  enrollmentDate: z.string(),
  academicYear: z.string(),
  level: z.string()
});

const updateStudentSchema = createStudentSchema.partial();

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  classId: z.string().transform(val => parseInt(val)).optional(),
  schoolId: z.string().transform(val => parseInt(val)).optional(),
  level: z.string().optional(),
  gender: z.enum(["male", "female"]).optional()
});

// =====================================
// Helper Functions
// =====================================

async function mapStudentToResponse(student: Student): Promise<StudentResponse> {
  const enrollments = await database.getEnrollmentsByStudentId(student.id);
  const currentClasses = await database.getClassesByStudentId(student.id);

  const enrollmentResponses = await Promise.all(enrollments.map(async (enrollment) => {
    const cls = await database.getById<Class>("classes", enrollment.classId);
    const school = cls ? await database.getById<School>("schools", cls.schoolId) : null;
    
    return {
      id: enrollment.id,
      class: cls ? { id: cls.id, name: cls.name } : { id: 0, name: "Unknown" },
      school: school ? { id: school.id, name: school.name } : { id: 0, name: "Unknown" },
      status: enrollment.status,
      enrollmentDate: enrollment.enrollmentDate
    };
  }));

  return {
    ...student,
    enrollments: enrollmentResponses,
    currentClasses: currentClasses.map(cls => ({
      id: cls.id,
      name: cls.name
    }))
  };
}

async function applyFilters(students: Student[], filters: any): Promise<Student[]> {
  let filtered = students;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(student => 
      student.name.toLowerCase().includes(searchLower) ||
      student.fullName.toLowerCase().includes(searchLower)
    );
  }

  if (filters.classId) {
    const classStudents = await database.getStudentsByClassId(filters.classId);
    const classStudentIds = new Set(classStudents.map(s => s.id));
    filtered = filtered.filter(student => classStudentIds.has(student.id));
  }

  if (filters.schoolId) {
    const schoolClasses = await database.getClassesBySchoolId(filters.schoolId);
    const schoolStudentIds = new Set();
    for (const cls of schoolClasses) {
      const classStudents = await database.getStudentsByClassId(cls.id);
      classStudents.forEach(student => schoolStudentIds.add(student.id));
    }
    filtered = filtered.filter(student => schoolStudentIds.has(student.id));
  }

  if (filters.level) {
    filtered = filtered.filter(student => student.level === filters.level);
  }

  if (filters.gender) {
    filtered = filtered.filter(student => student.gender === filters.gender);
  }

  return filtered;
}

function applySorting(students: Student[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): Student[] {
  if (!sortBy) return students;

  return students.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "fullName":
        aVal = a.fullName.toLowerCase();
        bVal = b.fullName.toLowerCase();
        break;
      case "enrollmentDate":
        aVal = new Date(a.enrollmentDate);
        bVal = new Date(b.enrollmentDate);
        break;
      case "level":
        aVal = a.level;
        bVal = b.level;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
}

function applyPagination<T>(items: T[], page: number, limit: number): { items: T[], total: number, pagination: any } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    total,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// =====================================
// Route Handlers
// =====================================

// GET /api/students - Get all students with filtering and pagination
export const getStudents: RequestHandler = async (req, res) => {
  try {
    const validation = paginationSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid query parameters",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const { page = 1, limit = 10, sortBy, sortOrder, ...filters } = validation.data;

    let students = await database.getAll<Student>("students");
    
    // Apply filters
    students = await applyFilters(students, filters);
    
    // Apply sorting
    students = applySorting(students, sortBy, sortOrder);
    
    // Apply pagination
    const { items: paginatedStudents, total, pagination } = applyPagination(students, page, limit);
    
    // Map to response format
    const studentResponses = await Promise.all(paginatedStudents.map(mapStudentToResponse));

    const response: ApiResponse<StudentsListResponse> = {
      success: true,
      data: {
        students: studentResponses,
        total
      },
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting students:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get students",
        statusCode: 500
      }
    });
  }
};

// GET /api/students/:id - Get student by ID
export const getStudentById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid student ID",
          statusCode: 400
        }
      });
    }

    const student = await database.getById<Student>("students", id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Student not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<StudentResponse> = {
      success: true,
      data: await mapStudentToResponse(student)
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting student:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get student",
        statusCode: 500
      }
    });
  }
};

// POST /api/students - Create new student
export const createStudent: RequestHandler = async (req, res) => {
  try {
    const validation = createStudentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid student data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const studentData = validation.data as CreateStudentRequest;
    
    // Create the student
    const newStudent = await database.create<Student>("students", studentData);

    const response: ApiResponse<StudentResponse> = {
      success: true,
      data: await mapStudentToResponse(newStudent)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create student",
        statusCode: 500
      }
    });
  }
};

// PUT /api/students/:id - Update student
export const updateStudent: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid student ID",
          statusCode: 400
        }
      });
    }

    const validation = updateStudentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid student data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData: UpdateStudentRequest = validation.data;
    
    // Check if student exists
    const existingStudent = await database.getById<Student>("students", id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Student not found",
          statusCode: 404
        }
      });
    }

    // Update the student
    const updatedStudent = await database.update<Student>("students", id, updateData);
    if (!updatedStudent) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to update student",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<StudentResponse> = {
      success: true,
      data: await mapStudentToResponse(updatedStudent)
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update student",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/students/:id - Delete student
export const deleteStudent: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid student ID",
          statusCode: 400
        }
      });
    }

    // Check if student exists
    const existingStudent = await database.getById<Student>("students", id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Student not found",
          statusCode: 404
        }
      });
    }

    // Remove all enrollments for this student before deletion
    const studentEnrollments = await database.getEnrollmentsByStudentId(id);
    for (const enrollment of studentEnrollments) {
      await database.delete("enrollments", enrollment.id);
      // Update class student count
      await database.updateClassStudentCount(enrollment.classId);
    }

    // Delete the student
    const deleted = await database.delete("students", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to delete student",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Student deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete student",
        statusCode: 500
      }
    });
  }
};

// GET /api/students/:id/classes - Get classes for a specific student
export const getStudentClasses: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid student ID",
          statusCode: 400
        }
      });
    }

    const student = await database.getById<Student>("students", id);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Student not found",
          statusCode: 404
        }
      });
    }

    const classes = await database.getClassesByStudentId(id);
    const classesWithDetails = await Promise.all(classes.map(async (cls) => {
      const school = await database.getById<School>("schools", cls.schoolId);
      const teacher = cls.teacherId ? await database.getById("teachers", cls.teacherId) as any : null;
      
      return {
        id: cls.id,
        name: cls.name,
        school: school ? { id: school.id, name: school.name } : null,
        teacher: teacher ? { id: teacher.id, name: teacher.name } : null,
        academicYear: cls.academicYear
      };
    }));

    res.json({
      success: true,
      data: classesWithDetails
    });
  } catch (error) {
    console.error("Error getting student classes:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get student classes",
        statusCode: 500
      }
    });
  }
};
