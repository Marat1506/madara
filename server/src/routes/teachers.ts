import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  CreateTeacherRequest,
  UpdateTeacherRequest,
  TeacherResponse,
  TeachersListResponse,
  PaginationParams,
  ApiResponse,
  Teacher,
  School,
  Class
} from "../../../shared/api";

// =====================================
// Validation Schemas
// =====================================

const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  schoolIds: z.array(z.number()).min(1, "At least one school is required"),
  qualifications: z.array(z.string()).optional(),
  joinDate: z.string().optional()
});

const updateTeacherSchema = createTeacherSchema.partial();

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  schoolId: z.string().transform(val => parseInt(val)).optional(),
  subject: z.string().optional()
});

// =====================================
// Helper Functions
// =====================================

async function mapTeacherToResponse(teacher: Teacher): Promise<TeacherResponse> {
  const schoolPromises = teacher.schoolIds.map(schoolId => database.getById<School>("schools", schoolId));
  const schoolResults = await Promise.all(schoolPromises);
  const schools = schoolResults
    .filter(Boolean)
    .map(school => ({ id: school!.id, name: school!.name }));

  // Count classes and students for this teacher
  const allClasses = await database.getAll<Class>("classes");
  const teacherClasses = allClasses.filter(cls => cls.teacherId === teacher.id);
  const uniqueStudentIds = new Set<number>();
  
  for (const cls of teacherClasses) {
    const classStudents = await database.getStudentsByClassId(cls.id);
    classStudents.forEach(student => uniqueStudentIds.add(student.id));
  }

  return {
    ...teacher,
    schools,
    classesCount: teacherClasses.length,
    studentsCount: uniqueStudentIds.size
  };
}

async function applyFilters(teachers: Teacher[], filters: any): Promise<Teacher[]> {
  let filtered = teachers;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(teacher => 
      teacher.name.toLowerCase().includes(searchLower) ||
      (teacher.email && teacher.email.toLowerCase().includes(searchLower))
    );
  }

  if (filters.schoolId) {
    filtered = filtered.filter(teacher => teacher.schoolIds.includes(filters.schoolId));
  }

  if (filters.subject) {
    const subjectLower = filters.subject.toLowerCase();
    filtered = filtered.filter(teacher => 
      teacher.subjects.some(subject => subject.toLowerCase().includes(subjectLower))
    );
  }

  return filtered;
}

function applySorting(teachers: Teacher[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): Teacher[] {
  if (!sortBy) return teachers;

  return teachers.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "joinDate":
        aVal = new Date(a.joinDate);
        bVal = new Date(b.joinDate);
        break;
      case "subjectsCount":
        aVal = a.subjects.length;
        bVal = b.subjects.length;
        break;
      case "schoolsCount":
        aVal = a.schoolIds.length;
        bVal = b.schoolIds.length;
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

// GET /api/teachers - Get all teachers with filtering and pagination
export const getTeachers: RequestHandler = async (req, res) => {
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

    let teachers = await database.getAll<Teacher>("teachers");
    
    // Apply filters
    teachers = await applyFilters(teachers, filters);
    
    // Apply sorting
    teachers = applySorting(teachers, sortBy, sortOrder);
    
    // Apply pagination
    const { items: paginatedTeachers, total, pagination } = applyPagination(teachers, page, limit);
    
    // Map to response format
    const teacherResponses = await Promise.all(paginatedTeachers.map(mapTeacherToResponse));

    const response: ApiResponse<TeachersListResponse> = {
      success: true,
      data: {
        teachers: teacherResponses,
        total
      },
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting teachers:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get teachers",
        statusCode: 500
      }
    });
  }
};

// GET /api/teachers/:id - Get teacher by ID
export const getTeacherById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher ID",
          statusCode: 400
        }
      });
    }

    const teacher = await database.getById<Teacher>("teachers", id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Teacher not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<TeacherResponse> = {
      success: true,
      data: await mapTeacherToResponse(teacher)
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting teacher:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get teacher",
        statusCode: 500
      }
    });
  }
};

// POST /api/teachers - Create new teacher
export const createTeacher: RequestHandler = async (req, res) => {
  try {
    const validation = createTeacherSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const teacherData = validation.data as CreateTeacherRequest;
    
    // Validate all schools exist
    for (const schoolId of teacherData.schoolIds) {
      const school = await database.getById<School>("schools", schoolId);
      if (!school) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: `School with ID ${schoolId} not found`,
            statusCode: 400
          }
        });
      }
    }

    // Check if teacher with the same email already exists (if email provided)
    if (teacherData.email) {
      const allTeachers = await database.getAll<Teacher>("teachers");
      const existingTeacher = allTeachers
        .find(teacher => teacher.email && teacher.email.toLowerCase() === teacherData.email!.toLowerCase());
      
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Teacher with this email already exists",
            statusCode: 400
          }
        });
      }
    }

    // Create the teacher
    const newTeacher = await database.create<Teacher>("teachers", teacherData as any);

    const response: ApiResponse<TeacherResponse> = {
      success: true,
      data: await mapTeacherToResponse(newTeacher)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create teacher",
        statusCode: 500
      }
    });
  }
};

// PUT /api/teachers/:id - Update teacher
export const updateTeacher: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher ID",
          statusCode: 400
        }
      });
    }

    const validation = updateTeacherSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData: UpdateTeacherRequest = validation.data;
    
    // Check if teacher exists
    const existingTeacher = await database.getById<Teacher>("teachers", id);
    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Teacher not found",
          statusCode: 404
        }
      });
    }

    // Validate schools exist (if being updated)
    if (updateData.schoolIds) {
      for (const schoolId of updateData.schoolIds) {
        const school = await database.getById<School>("schools", schoolId);
        if (!school) {
          return res.status(400).json({
            success: false,
            error: {
              error: "Validation Error",
              message: `School with ID ${schoolId} not found`,
              statusCode: 400
            }
          });
        }
      }
    }

    // Check if email is being updated and if it conflicts with another teacher
    if (updateData.email && updateData.email !== existingTeacher.email) {
      const allTeachers = await database.getAll<Teacher>("teachers");
      const emailConflict = allTeachers
        .find(teacher => teacher.id !== id && teacher.email && 
                        teacher.email.toLowerCase() === updateData.email!.toLowerCase());
      
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Teacher with this email already exists",
            statusCode: 400
          }
        });
      }
    }

    // If removing schools, check if teacher has classes in those schools
    if (updateData.schoolIds) {
      const removedSchoolIds = existingTeacher.schoolIds.filter(schoolId => 
        !updateData.schoolIds!.includes(schoolId)
      );

      for (const schoolId of removedSchoolIds) {
        const allClasses = await database.getAll<Class>("classes");
        const teacherClassesInSchool = allClasses
          .filter(cls => cls.schoolId === schoolId && cls.teacherId === id);
        
        if (teacherClassesInSchool.length > 0) {
          return res.status(400).json({
            success: false,
            error: {
              error: "Validation Error",
              message: `Cannot remove teacher from school. Teacher has classes assigned in school ID ${schoolId}`,
              statusCode: 400
            }
          });
        }
      }
    }

    // Update the teacher
    const updatedTeacher = await database.update<Teacher>("teachers", id, updateData);
    if (!updatedTeacher) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to update teacher",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<TeacherResponse> = {
      success: true,
      data: await mapTeacherToResponse(updatedTeacher)
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update teacher",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/teachers/:id - Delete teacher
export const deleteTeacher: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher ID",
          statusCode: 400
        }
      });
    }

    // Check if teacher exists
    const existingTeacher = await database.getById<Teacher>("teachers", id);
    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Teacher not found",
          statusCode: 404
        }
      });
    }

    // Check if teacher has assigned classes
    const allClasses = await database.getAll<Class>("classes");
    const teacherClasses = allClasses.filter(cls => cls.teacherId === id);
    if (teacherClasses.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete teacher with assigned classes. Please reassign classes first.",
          statusCode: 400
        }
      });
    }

    // Delete the teacher
    const deleted = await database.delete("teachers", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to delete teacher",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Teacher deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete teacher",
        statusCode: 500
      }
    });
  }
};

// GET /api/teachers/:id/classes - Get classes for a specific teacher
export const getTeacherClasses: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher ID",
          statusCode: 400
        }
      });
    }

    const teacher = await database.getById<Teacher>("teachers", id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Teacher not found",
          statusCode: 404
        }
      });
    }

    const allClasses = await database.getAll<Class>("classes");
    const classes = allClasses.filter(cls => cls.teacherId === id);
    const classesWithDetails = await Promise.all(classes.map(async cls => {
      const school = await database.getById<School>("schools", cls.schoolId);
      const students = await database.getStudentsByClassId(cls.id);
      const studentCount = students.length;
      
      return {
        id: cls.id,
        name: cls.name,
        school: school ? { id: school.id, name: school.name } : null,
        studentsCount: studentCount,
        maxStudents: cls.maxStudents,
        academicYear: cls.academicYear,
        subjectsCount: cls.subjectIds.length
      };
    }));

    res.json({
      success: true,
      data: classesWithDetails
    });
  } catch (error) {
    console.error("Error getting teacher classes:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get teacher classes",
        statusCode: 500
      }
    });
  }
};

// GET /api/teachers/:id/students - Get students for a specific teacher
export const getTeacherStudents: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher ID",
          statusCode: 400
        }
      });
    }

    const teacher = await database.getById<Teacher>("teachers", id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Teacher not found",
          statusCode: 404
        }
      });
    }

    const allClasses = await database.getAll<Class>("classes");
    const teacherClasses = allClasses.filter(cls => cls.teacherId === id);
    const studentIds = new Set<number>();
    const studentClasses = new Map<number, string[]>();

    // Collect all unique students from teacher's classes
    for (const cls of teacherClasses) {
      const classStudents = await database.getStudentsByClassId(cls.id);
      classStudents.forEach(student => {
        studentIds.add(student.id);
        if (!studentClasses.has(student.id)) {
          studentClasses.set(student.id, []);
        }
        studentClasses.get(student.id)!.push(cls.name);
      });
    }

    const students = await Promise.all(Array.from(studentIds).map(async studentId => {
      const student = await database.getById("students", studentId) as any;
      return student ? {
        id: student.id,
        name: student.name,
        fullName: student.fullName,
        level: student.level,
        classes: studentClasses.get(studentId) || []
      } : null;
    }));

    const filteredStudents = students.filter(Boolean);

    res.json({
      success: true,
      data: filteredStudents
    });
  } catch (error) {
    console.error("Error getting teacher students:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get teacher students",
        statusCode: 500
      }
    });
  }
};
