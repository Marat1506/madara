import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  EnrollmentResponse,
  EnrollmentsListResponse,
  PaginationParams,
  ApiResponse,
  Enrollment,
  Student,
  Class,
  School
} from "../../../shared/api";

// =====================================
// Validation Schemas
// =====================================

const createEnrollmentSchema = z.object({
  studentId: z.number(),
  classId: z.number(),
  enrollmentDate: z.string(),
  academicYear: z.string()
});

const updateEnrollmentSchema = z.object({
  status: z.enum(["active", "inactive", "transferred", "graduated"])
});

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  studentId: z.string().transform(val => parseInt(val)).optional(),
  classId: z.string().transform(val => parseInt(val)).optional(),
  schoolId: z.string().transform(val => parseInt(val)).optional(),
  status: z.enum(["active", "inactive", "transferred", "graduated"]).optional(),
  academicYear: z.string().optional()
});

// =====================================
// Helper Functions
// =====================================

async function mapEnrollmentToResponse(enrollment: Enrollment): Promise<EnrollmentResponse> {
  const student = await database.getById<Student>("students", enrollment.studentId);
  const cls = await database.getById<Class>("classes", enrollment.classId);
  const school = cls ? await database.getById<School>("schools", cls.schoolId) : null;

  return {
    ...enrollment,
    student: student ? { 
      id: student.id, 
      name: student.name, 
      fullName: student.fullName 
    } : { id: 0, name: "Unknown", fullName: "Unknown Student" },
    class: cls ? { 
      id: cls.id, 
      name: cls.name 
    } : { id: 0, name: "Unknown" },
    school: school ? { 
      id: school.id, 
      name: school.name 
    } : { id: 0, name: "Unknown" }
  };
}

async function applyFilters(enrollments: Enrollment[], filters: any): Promise<Enrollment[]> {
  let filtered = enrollments;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const filteredResults = [];
    
    for (const enrollment of filtered) {
      const student = await database.getById<Student>("students", enrollment.studentId);
      const cls = await database.getById<Class>("classes", enrollment.classId);
      
      if ((student && (
        student.name.toLowerCase().includes(searchLower) ||
        student.fullName.toLowerCase().includes(searchLower)
      )) || (cls && cls.name.toLowerCase().includes(searchLower))) {
        filteredResults.push(enrollment);
      }
    }
    filtered = filteredResults;
  }

  if (filters.studentId) {
    filtered = filtered.filter(enrollment => enrollment.studentId === filters.studentId);
  }

  if (filters.classId) {
    filtered = filtered.filter(enrollment => enrollment.classId === filters.classId);
  }

  if (filters.schoolId) {
    const schoolFilteredResults = [];
    for (const enrollment of filtered) {
      const cls = await database.getById<Class>("classes", enrollment.classId);
      if (cls && cls.schoolId === filters.schoolId) {
        schoolFilteredResults.push(enrollment);
      }
    }
    filtered = schoolFilteredResults;
  }

  if (filters.status) {
    filtered = filtered.filter(enrollment => enrollment.status === filters.status);
  }

  if (filters.academicYear) {
    filtered = filtered.filter(enrollment => enrollment.academicYear === filters.academicYear);
  }

  return filtered;
}

async function applySorting(enrollments: Enrollment[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): Promise<Enrollment[]> {
  if (!sortBy) return enrollments;

  // For sorting by student or class names, we need to fetch the data first
  if (sortBy === "studentName" || sortBy === "className") {
    const enrollmentsWithData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = sortBy === "studentName" ? await database.getById<Student>("students", enrollment.studentId) : null;
        const cls = sortBy === "className" ? await database.getById<Class>("classes", enrollment.classId) : null;
        return {
          enrollment,
          studentName: student ? student.name.toLowerCase() : "",
          className: cls ? cls.name.toLowerCase() : ""
        };
      })
    );

    enrollmentsWithData.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortBy === "studentName") {
        aVal = a.studentName;
        bVal = b.studentName;
      } else {
        aVal = a.className;
        bVal = b.className;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return enrollmentsWithData.map(item => item.enrollment);
  }

  // For other sorting fields, sort directly
  return enrollments.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "enrollmentDate":
        aVal = new Date(a.enrollmentDate);
        bVal = new Date(b.enrollmentDate);
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "academicYear":
        aVal = a.academicYear;
        bVal = b.academicYear;
        break;
      case "createdAt":
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
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

// GET /api/enrollments - Get all enrollments with filtering and pagination
export const getEnrollments: RequestHandler = async (req, res) => {
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

    let enrollments = await database.getAll<Enrollment>("enrollments");
    
    // Apply filters
    enrollments = await applyFilters(enrollments, filters);
    
    // Apply sorting
    enrollments = await applySorting(enrollments, sortBy, sortOrder);
    
    // Apply pagination
    const { items: paginatedEnrollments, total, pagination } = applyPagination(enrollments, page, limit);
    
    // Map to response format
    const enrollmentResponses = await Promise.all(
      paginatedEnrollments.map(enrollment => mapEnrollmentToResponse(enrollment))
    );

    const response: ApiResponse<EnrollmentsListResponse> = {
      success: true,
      data: {
        enrollments: enrollmentResponses,
        total
      },
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting enrollments:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get enrollments",
        statusCode: 500
      }
    });
  }
};

// GET /api/enrollments/:id - Get enrollment by ID
export const getEnrollmentById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid enrollment ID",
          statusCode: 400
        }
      });
    }

    const enrollment = await database.getById<Enrollment>("enrollments", id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Enrollment not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<EnrollmentResponse> = {
      success: true,
      data: await mapEnrollmentToResponse(enrollment)
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting enrollment:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get enrollment",
        statusCode: 500
      }
    });
  }
};

// POST /api/enrollments - Create new enrollment
export const createEnrollment: RequestHandler = async (req, res) => {
  try {
    const validation = createEnrollmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid enrollment data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const enrollmentData = validation.data as CreateEnrollmentRequest;
    
    // Validate student exists
    const student = await database.getById<Student>("students", enrollmentData.studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Student not found",
          statusCode: 400
        }
      });
    }

    // Validate class exists
    const cls = await database.getById<Class>("classes", enrollmentData.classId);
    if (!cls) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Class not found",
          statusCode: 400
        }
      });
    }

    // Check if student is already enrolled in this class
    const allEnrollments = await database.getAll<Enrollment>("enrollments");
    const existingEnrollment = allEnrollments
      .find(enrollment => 
        enrollment.studentId === enrollmentData.studentId && 
        enrollment.classId === enrollmentData.classId &&
        enrollment.status === "active"
      );
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Student is already enrolled in this class",
          statusCode: 400
        }
      });
    }

    // Check if class has space
    const activeEnrollments = (await database.getEnrollmentsByClassId(enrollmentData.classId))
      .filter(enrollment => enrollment.status === "active");
    
    if (activeEnrollments.length >= cls.maxStudents) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Class is full. Maximum students reached.",
          statusCode: 400
        }
      });
    }

    // Create the enrollment
    const newEnrollment = await database.create<Enrollment>("enrollments", {
      ...enrollmentData,
      status: "active"
    });

    // Update class student count
    await database.updateClassStudentCount(enrollmentData.classId);

    const response: ApiResponse<EnrollmentResponse> = {
      success: true,
      data: await mapEnrollmentToResponse(newEnrollment)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating enrollment:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create enrollment",
        statusCode: 500
      }
    });
  }
};

// PUT /api/enrollments/:id - Update enrollment
export const updateEnrollment: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid enrollment ID",
          statusCode: 400
        }
      });
    }

    const validation = updateEnrollmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid enrollment data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData = validation.data as UpdateEnrollmentRequest;
    
    // Check if enrollment exists
    const existingEnrollment = await database.getById<Enrollment>("enrollments", id);
    if (!existingEnrollment) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Enrollment not found",
          statusCode: 404
        }
      });
    }

    // Update the enrollment
    const updatedEnrollment = await database.update<Enrollment>("enrollments", id, updateData);
    if (!updatedEnrollment) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to update enrollment",
          statusCode: 500
        }
      });
    }

    // Update class student count
    await database.updateClassStudentCount(existingEnrollment.classId);

    const response: ApiResponse<EnrollmentResponse> = {
      success: true,
      data: await mapEnrollmentToResponse(updatedEnrollment)
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating enrollment:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update enrollment",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/enrollments/:id - Delete enrollment
export const deleteEnrollment: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid enrollment ID",
          statusCode: 400
        }
      });
    }

    // Check if enrollment exists
    const existingEnrollment = await database.getById<Enrollment>("enrollments", id);
    if (!existingEnrollment) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Enrollment not found",
          statusCode: 404
        }
      });
    }

    // Delete the enrollment
    const deleted = await database.delete("enrollments", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to delete enrollment",
          statusCode: 500
        }
      });
    }

    // Update class student count
    await database.updateClassStudentCount(existingEnrollment.classId);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Enrollment deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete enrollment",
        statusCode: 500
      }
    });
  }
};

// POST /api/enrollments/bulk - Bulk enroll students
export const bulkCreateEnrollments: RequestHandler = async (req, res) => {
  try {
    const { studentIds, classId, enrollmentDate, academicYear } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "studentIds must be a non-empty array",
          statusCode: 400
        }
      });
    }

    // Validate class exists
    const cls = await database.getById<Class>("classes", classId);
    if (!cls) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Class not found",
          statusCode: 400
        }
      });
    }

    const createdEnrollments: EnrollmentResponse[] = [];
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        // Validate student exists
        const student = await database.getById<Student>("students", studentId);
        if (!student) {
          errors.push(`Student with ID ${studentId} not found`);
          continue;
        }

        // Check if student is already enrolled
        const allEnrollments = await database.getAll<Enrollment>("enrollments");
        const existingEnrollment = allEnrollments
          .find(enrollment => 
            enrollment.studentId === studentId && 
            enrollment.classId === classId &&
            enrollment.status === "active"
          );
        
        if (existingEnrollment) {
          errors.push(`Student ${student.name} is already enrolled in this class`);
          continue;
        }

        // Check class capacity
        const activeEnrollments = (await database.getEnrollmentsByClassId(classId))
          .filter(enrollment => enrollment.status === "active");
        
        if (activeEnrollments.length >= cls.maxStudents) {
          errors.push(`Class is full. Cannot enroll student ${student.name}`);
          continue;
        }

        // Create enrollment
        const newEnrollment = await database.create<Enrollment>("enrollments", {
          studentId,
          classId,
          enrollmentDate,
          academicYear,
          status: "active"
        });

        createdEnrollments.push(await mapEnrollmentToResponse(newEnrollment));
      } catch (error) {
        errors.push(`Failed to enroll student with ID ${studentId}`);
      }
    }

    // Update class student count
    await database.updateClassStudentCount(classId);

    res.json({
      success: true,
      data: {
        created: createdEnrollments,
        errors
      }
    });
  } catch (error) {
    console.error("Error bulk creating enrollments:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to bulk create enrollments",
        statusCode: 500
      }
    });
  }
};

// PUT /api/enrollments/:id/transfer - Transfer student to another class
export const transferStudent: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { newClassId } = req.body;

    if (isNaN(id) || !newClassId) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid enrollment ID or new class ID",
          statusCode: 400
        }
      });
    }

    // Check if enrollment exists
    const existingEnrollment = await database.getById<Enrollment>("enrollments", id);
    if (!existingEnrollment) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Enrollment not found",
          statusCode: 404
        }
      });
    }

    // Validate new class exists
    const newClass = await database.getById<Class>("classes", newClassId);
    if (!newClass) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "New class not found",
          statusCode: 400
        }
      });
    }

    // Check if student is already enrolled in the new class
    const allEnrollments = await database.getAll<Enrollment>("enrollments");
    const existingNewEnrollment = allEnrollments
      .find(enrollment => 
        enrollment.studentId === existingEnrollment.studentId && 
        enrollment.classId === newClassId &&
        enrollment.status === "active"
      );
    
    if (existingNewEnrollment) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Student is already enrolled in the new class",
          statusCode: 400
        }
      });
    }

    // Check if new class has space
    const activeEnrollments = (await database.getEnrollmentsByClassId(newClassId))
      .filter(enrollment => enrollment.status === "active");
    
    if (activeEnrollments.length >= newClass.maxStudents) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "New class is full. Maximum students reached.",
          statusCode: 400
        }
      });
    }

    const oldClassId = existingEnrollment.classId;

    // Update enrollment status to transferred
    await database.update<Enrollment>("enrollments", id, { status: "transferred" });

    // Create new enrollment
    const newEnrollment = await database.create<Enrollment>("enrollments", {
      studentId: existingEnrollment.studentId,
      classId: newClassId,
      enrollmentDate: new Date().toISOString().split('T')[0],
      academicYear: existingEnrollment.academicYear,
      status: "active"
    });

    // Update class student counts
    await database.updateClassStudentCount(oldClassId);
    await database.updateClassStudentCount(newClassId);

    const response: ApiResponse<EnrollmentResponse> = {
      success: true,
      data: await mapEnrollmentToResponse(newEnrollment)
    };

    res.json(response);
  } catch (error) {
    console.error("Error transferring student:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to transfer student",
        statusCode: 500
      }
    });
  }
};
