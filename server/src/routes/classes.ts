import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  CreateClassRequest,
  UpdateClassRequest,
  ClassResponse,
  ClassesListResponse,
  PaginationParams,
  ApiResponse,
  Class,
  School,
  Teacher,
  Subject,
  Student,
  ClassSchedule
} from "../../../shared/api";

// =====================================
// Validation Schemas
// =====================================

const scheduleSchema = z.object({
  subjectId: z.number(),
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  room: z.string().max(100).optional()
});

const createClassSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  schoolId: z.number(),
  teacherId: z.number().optional(),
  subjectIds: z.array(z.number()).min(1, "At least one subject is required"),
  primarySubjectId: z.number().optional(),
  maxStudents: z.number().min(1).max(100),
  academicYear: z.string(),
  schedule: z.array(scheduleSchema).optional()
});

const updateClassSchema = createClassSchema.partial();

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  schoolId: z.string().transform(val => parseInt(val)).optional(),
  teacherId: z.string().transform(val => parseInt(val)).optional(),
  subjectId: z.string().transform(val => parseInt(val)).optional(),
  academicYear: z.string().optional()
});

// =====================================
// Helper Functions
// =====================================

async function mapClassToResponse(cls: Class): Promise<ClassResponse> {
  const school = await database.getById<School>("schools", cls.schoolId);
  const teacher = cls.teacherId ? await database.getById<Teacher>("teachers", cls.teacherId) : null;
  const subjects = await Promise.all(cls.subjectIds.map(async subjectId => await database.getById<Subject>("subjects", subjectId))).then(results => results.filter(Boolean));
  const primarySubject = cls.primarySubjectId ? await database.getById<Subject>("subjects", cls.primarySubjectId) : null;
  const students = await database.getStudentsByClassId(cls.id);
  const schedule = await database.getSchedulesByClassId(cls.id);

  return {
    ...cls,
    school: school ? { id: school.id, name: school.name } : { id: 0, name: "Unknown" },
    teacher: teacher ? { id: teacher.id, name: teacher.name } : undefined,
    subjects: subjects.map(subject => ({ 
      id: subject.id, 
      name: subject.name, 
      nameArabic: subject.nameArabic 
    })),
    primarySubject: primarySubject ? { 
      id: primarySubject.id, 
      name: primarySubject.name, 
      nameArabic: primarySubject.nameArabic 
    } : undefined,
    students: students.map(student => ({ 
      id: student.id, 
      name: student.name, 
      fullName: student.fullName 
    })),
    schedule
  };
}

function applyFilters(classes: Class[], filters: any): Class[] {
  let filtered = classes;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(cls => 
      cls.name.toLowerCase().includes(searchLower)
    );
  }

  if (filters.schoolId) {
    filtered = filtered.filter(cls => cls.schoolId === filters.schoolId);
  }

  if (filters.teacherId) {
    filtered = filtered.filter(cls => cls.teacherId === filters.teacherId);
  }

  if (filters.subjectId) {
    filtered = filtered.filter(cls => cls.subjectIds.includes(filters.subjectId));
  }

  if (filters.academicYear) {
    filtered = filtered.filter(cls => cls.academicYear === filters.academicYear);
  }

  return filtered;
}

function applySorting(classes: Class[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): Class[] {
  if (!sortBy) return classes;

  return classes.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "maxStudents":
        aVal = a.maxStudents;
        bVal = b.maxStudents;
        break;
      case "currentStudents":
        aVal = a.currentStudents;
        bVal = b.currentStudents;
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

function validateScheduleTime(startTime: string, endTime: string): boolean {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  return start < end;
}

// =====================================
// Route Handlers
// =====================================

// GET /api/classes - Get all classes with filtering and pagination
export const getClasses: RequestHandler = async (req, res) => {
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

    let classes = await database.getAll<Class>("classes");
    
    // Apply filters
    classes = applyFilters(classes, filters);
    
    // Apply sorting
    classes = applySorting(classes, sortBy, sortOrder);
    
    // Apply pagination
    const { items: paginatedClasses, total, pagination } = applyPagination(classes, page, limit);
    
    // Map to response format
    const classResponses = await Promise.all(paginatedClasses.map(mapClassToResponse));

    const response: ApiResponse<ClassesListResponse> = {
      success: true,
      data: {
        classes: classResponses,
        total
      },
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting classes:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get classes",
        statusCode: 500
      }
    });
  }
};

// GET /api/classes/:id - Get class by ID
export const getClassById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class ID",
          statusCode: 400
        }
      });
    }

    const cls = await database.getById<Class>("classes", id);
    if (!cls) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Class not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<ClassResponse> = {
      success: true,
      data: await mapClassToResponse(cls)
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting class:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get class",
        statusCode: 500
      }
    });
  }
};

// POST /api/classes - Create new class
export const createClass: RequestHandler = async (req, res) => {
  try {
    const validation = createClassSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const classData = validation.data as CreateClassRequest;
    
    // Validate school exists
    const school = await database.getById<School>("schools", classData.schoolId);
    if (!school) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "School not found",
          statusCode: 400
        }
      });
    }

    // Validate teacher exists (if provided)
    if (classData.teacherId) {
      const teacher = await database.getById<Teacher>("teachers", classData.teacherId);
      if (!teacher) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Teacher not found",
            statusCode: 400
          }
        });
      }

      // Check if teacher is assigned to the school
      if (!teacher.schoolIds.includes(classData.schoolId)) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Teacher is not assigned to this school",
            statusCode: 400
          }
        });
      }
    }

    // Validate subjects exist
    for (const subjectId of classData.subjectIds) {
      const subject = await database.getById<Subject>("subjects", subjectId);
      if (!subject) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: `Subject with ID ${subjectId} not found`,
            statusCode: 400
          }
        });
      }
    }

    // Validate primary subject is in the subject list
    if (classData.primarySubjectId && !classData.subjectIds.includes(classData.primarySubjectId)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Primary subject must be included in the subject list",
          statusCode: 400
        }
      });
    }

    // Validate schedule times
    if (classData.schedule) {
      for (const scheduleItem of classData.schedule) {
        if (!validateScheduleTime(scheduleItem.startTime, scheduleItem.endTime)) {
          return res.status(400).json({
            success: false,
            error: {
              error: "Validation Error",
              message: "End time must be after start time",
              statusCode: 400
            }
          });
        }

        // Validate schedule subject is in class subjects
        if (!classData.subjectIds.includes(scheduleItem.subjectId)) {
          return res.status(400).json({
            success: false,
            error: {
              error: "Validation Error",
              message: "Schedule subject must be included in class subjects",
              statusCode: 400
            }
          });
        }
      }
    }

    // Check if class name is unique within the school
    const existingClass = (await database.getAll<Class>("classes"))
      .find(cls => cls.schoolId === classData.schoolId && 
                   cls.name.toLowerCase() === classData.name.toLowerCase());
    
    if (existingClass) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Class with this name already exists in the school",
          statusCode: 400
        }
      });
    }

    // Create the class
    const newClass = await database.create<Class>("classes", {
      name: classData.name,
      schoolId: classData.schoolId,
      teacherId: classData.teacherId,
      subjectIds: classData.subjectIds,
      primarySubjectId: classData.primarySubjectId,
      maxStudents: classData.maxStudents,
      academicYear: classData.academicYear,
      currentStudents: 0, // Start with 0 students
      schedule: [] // Will be populated separately if provided
    });

    // Create schedule entries if provided
    if (classData.schedule) {
      for (const scheduleItem of classData.schedule) {
        await database.create<ClassSchedule>("schedules", {
          classId: newClass.id,
          ...scheduleItem
        });
      }
    }

    const response: ApiResponse<ClassResponse> = {
      success: true,
      data: await mapClassToResponse(newClass)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create class",
        statusCode: 500
      }
    });
  }
};

// PUT /api/classes/:id - Update class
export const updateClass: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class ID",
          statusCode: 400
        }
      });
    }

    const validation = updateClassSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData = validation.data as UpdateClassRequest;
    
    // Check if class exists
    const existingClass = await database.getById<Class>("classes", id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Class not found",
          statusCode: 404
        }
      });
    }

    // Validate school exists (if being updated)
    if (updateData.schoolId) {
      const school = await database.getById<School>("schools", updateData.schoolId);
      if (!school) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "School not found",
            statusCode: 400
          }
        });
      }
    }

    // Validate teacher exists (if being updated)
    if (updateData.teacherId) {
      const teacher = await database.getById<Teacher>("teachers", updateData.teacherId);
      if (!teacher) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Teacher not found",
            statusCode: 400
          }
        });
      }

      const schoolId = updateData.schoolId || existingClass.schoolId;
      if (!teacher.schoolIds.includes(schoolId)) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Teacher is not assigned to this school",
            statusCode: 400
          }
        });
      }
    }

    // Validate subjects exist (if being updated)
    if (updateData.subjectIds) {
      for (const subjectId of updateData.subjectIds) {
        const subject = await database.getById<Subject>("subjects", subjectId);
        if (!subject) {
          return res.status(400).json({
            success: false,
            error: {
              error: "Validation Error",
              message: `Subject with ID ${subjectId} not found`,
              statusCode: 400
            }
          });
        }
      }

      // Validate primary subject is in the updated subject list
      const primarySubjectId = updateData.primarySubjectId || existingClass.primarySubjectId;
      if (primarySubjectId && !updateData.subjectIds.includes(primarySubjectId)) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Primary subject must be included in the subject list",
            statusCode: 400
          }
        });
      }
    }

    // Check if name is being updated and if it conflicts with another class in the same school
    if (updateData.name && updateData.name.toLowerCase() !== existingClass.name.toLowerCase()) {
      const schoolId = updateData.schoolId || existingClass.schoolId;
      const nameConflict = (await database.getAll<Class>("classes"))
        .find(cls => cls.id !== id && cls.schoolId === schoolId && 
                     cls.name.toLowerCase() === updateData.name!.toLowerCase());
      
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Class with this name already exists in the school",
            statusCode: 400
          }
        });
      }
    }

    // Update the class
    const updatedClass = await database.update<Class>("classes", id, updateData as any);
    if (!updatedClass) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to update class",
          statusCode: 500
        }
      });
    }

    // Update schedule if provided
    if (updateData.schedule) {
      // Remove existing schedule
      const existingSchedules = await database.getSchedulesByClassId(id);
      for (const schedule of existingSchedules) {
        await database.delete("schedules", schedule.id);
      }

      // Create new schedule entries
      for (const scheduleItem of updateData.schedule) {
        await database.create<ClassSchedule>("schedules", {
          classId: id,
          ...scheduleItem
        });
      }
    }

    const response: ApiResponse<ClassResponse> = {
      success: true,
      data: await mapClassToResponse(updatedClass)
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update class",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/classes/:id - Delete class
export const deleteClass: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class ID",
          statusCode: 400
        }
      });
    }

    // Check if class exists
    const existingClass = await database.getById<Class>("classes", id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Class not found",
          statusCode: 404
        }
      });
    }

    // Check if class has active enrollments
    const activeEnrollments = (await database.getEnrollmentsByClassId(id))
      .filter(enrollment => enrollment.status === "active");
    
    if (activeEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete class with active student enrollments. Please remove all students first.",
          statusCode: 400
        }
      });
    }

    // Delete associated schedules
    const schedules = await database.getSchedulesByClassId(id);
    for (const schedule of schedules) {
      await database.delete("schedules", schedule.id);
    }

    // Delete the class
    const deleted = await database.delete("classes", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to delete class",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Class deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete class",
        statusCode: 500
      }
    });
  }
};

// GET /api/classes/:id/students - Get students for a specific class
export const getClassStudents: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class ID",
          statusCode: 400
        }
      });
    }

    const cls = await database.getById<Class>("classes", id);
    if (!cls) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Class not found",
          statusCode: 404
        }
      });
    }

    const students = await database.getStudentsByClassId(id);
    const studentsWithDetails = await Promise.all(students.map(async student => {
      const enrollments = await database.getEnrollmentsByStudentId(student.id);
      const classEnrollment = enrollments.find(e => e.classId === id);
      
      return {
        id: student.id,
        name: student.name,
        fullName: student.fullName,
        level: student.level,
        enrollmentDate: classEnrollment?.enrollmentDate,
        status: classEnrollment?.status
      };
    }));

    res.json({
      success: true,
      data: studentsWithDetails
    });
  } catch (error) {
    console.error("Error getting class students:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get class students",
        statusCode: 500
      }
    });
  }
};

// GET /api/classes/:id/schedule - Get schedule for a specific class
export const getClassSchedule: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class ID",
          statusCode: 400
        }
      });
    }

    const cls = await database.getById<Class>("classes", id);
    if (!cls) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Class not found",
          statusCode: 404
        }
      });
    }

    const schedule = await database.getSchedulesByClassId(id);
    const scheduleWithDetails = await Promise.all(schedule.map(async scheduleItem => {
      const subject = await database.getById<Subject>("subjects", scheduleItem.subjectId);
      
      return {
        ...scheduleItem,
        subject: subject ? {
          id: subject.id,
          name: subject.name,
          nameArabic: subject.nameArabic
        } : null
      };
    }));

    res.json({
      success: true,
      data: scheduleWithDetails
    });
  } catch (error) {
    console.error("Error getting class schedule:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get class schedule",
        statusCode: 500
      }
    });
  }
};
