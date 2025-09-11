import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  CreateSchoolRequest,
  UpdateSchoolRequest,
  SchoolResponse,
  SchoolsListResponse,
  PaginationParams,
  ApiResponse,
  School,
  Class,
  Teacher
} from "../../../shared/api";

// =====================================
// Validation Schemas
// =====================================

const createSchoolSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["madrasa", "islamic_school", "regular_school"]),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal(""))
});

const updateSchoolSchema = createSchoolSchema.partial();

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  type: z.enum(["madrasa", "islamic_school", "regular_school"]).optional()
});

// =====================================
// Helper Functions
// =====================================

async function mapSchoolToResponse(school: School): Promise<SchoolResponse> {
  const classes = await database.getClassesBySchoolId(school.id);
  const teachers = await database.getTeachersBySchoolId(school.id);
  
  // Count unique students across all classes in this school
  const studentIds = new Set<number>();
  await Promise.all(classes.map(async cls => {
    const classStudents = await database.getStudentsByClassId(cls.id);
    classStudents.forEach(student => studentIds.add(student.id));
  }));

  return {
    ...school,
    studentsCount: studentIds.size,
    teachersCount: teachers.length,
    classesCount: classes.length
  };
}

function applyFilters(schools: School[], filters: any): School[] {
  let filtered = schools;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(school => 
      school.name.toLowerCase().includes(searchLower) ||
      (school.address && school.address.toLowerCase().includes(searchLower))
    );
  }

  if (filters.type) {
    filtered = filtered.filter(school => school.type === filters.type);
  }

  return filtered;
}

function applySorting(schools: School[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): School[] {
  if (!sortBy) return schools;

  return schools.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "foundedYear":
        aVal = a.foundedYear;
        bVal = b.foundedYear;
        break;
      case "type":
        aVal = a.type;
        bVal = b.type;
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

// GET /api/schools - Get all schools with filtering and pagination
export const getSchools: RequestHandler = async (req, res) => {
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

    let schools = await database.getAll<School>("schools");
    
    // Apply filters
    schools = applyFilters(schools, filters);
    
    // Apply sorting
    schools = applySorting(schools, sortBy, sortOrder);
    
    // Apply pagination
    const { items: paginatedSchools, total, pagination } = applyPagination(schools, page, limit);
    
    // Map to response format
    const schoolResponses = await Promise.all(paginatedSchools.map(mapSchoolToResponse));

    const response: ApiResponse<SchoolsListResponse> = {
      success: true,
      data: {
        schools: schoolResponses,
        total
      },
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting schools:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get schools",
        statusCode: 500
      }
    });
  }
};

// GET /api/schools/:id - Get school by ID
export const getSchoolById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    const school = await database.getById<School>("schools", id);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "School not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<SchoolResponse> = {
      success: true,
      data: await mapSchoolToResponse(school)
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting school:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get school",
        statusCode: 500
      }
    });
  }
};

// POST /api/schools - Create new school
export const createSchool: RequestHandler = async (req, res) => {
  try {
    const validation = createSchoolSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const schoolData = validation.data as CreateSchoolRequest;
    
    // Check if school with the same name already exists
    const existingSchool = (await database.getAll<School>("schools"))
      .find(school => school.name.toLowerCase() === schoolData.name.toLowerCase());
    
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "School with this name already exists",
          statusCode: 400
        }
      });
    }

    // Create the school
    const newSchool = await database.create<School>("schools", schoolData);

    const response: ApiResponse<SchoolResponse> = {
      success: true,
      data: await mapSchoolToResponse(newSchool)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating school:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create school",
        statusCode: 500
      }
    });
  }
};

// PUT /api/schools/:id - Update school
export const updateSchool: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    const validation = updateSchoolSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData: UpdateSchoolRequest = validation.data;
    
    // Check if school exists
    const existingSchool = await database.getById<School>("schools", id);
    if (!existingSchool) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "School not found",
          statusCode: 404
        }
      });
    }

    // Check if name is being updated and if it conflicts with another school
    if (updateData.name && updateData.name.toLowerCase() !== existingSchool.name.toLowerCase()) {
      const nameConflict = (await database.getAll<School>("schools"))
        .find(school => school.id !== id && school.name.toLowerCase() === updateData.name!.toLowerCase());
      
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "School with this name already exists",
            statusCode: 400
          }
        });
      }
    }

    // Update the school
    const updatedSchool = await database.update<School>("schools", id, updateData);
    if (!updatedSchool) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to update school",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<SchoolResponse> = {
      success: true,
      data: await mapSchoolToResponse(updatedSchool)
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating school:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update school",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/schools/:id - Delete school
export const deleteSchool: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    // Check if school exists
    const existingSchool = await database.getById<School>("schools", id);
    if (!existingSchool) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "School not found",
          statusCode: 404
        }
      });
    }

    // Check if school has classes
    const schoolClasses = await database.getClassesBySchoolId(id);
    if (schoolClasses.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete school with existing classes. Please remove all classes first.",
          statusCode: 400
        }
      });
    }

    // Check if school has teachers
    const schoolTeachers = await database.getTeachersBySchoolId(id);
    if (schoolTeachers.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete school with assigned teachers. Please reassign teachers first.",
          statusCode: 400
        }
      });
    }

    // Delete the school
    const deleted = await database.delete("schools", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to delete school",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "School deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting school:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete school",
        statusCode: 500
      }
    });
  }
};

// GET /api/schools/:id/classes - Get classes for a specific school
export const getSchoolClasses: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    const school = await database.getById<School>("schools", id);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "School not found",
          statusCode: 404
        }
      });
    }

    const classes = await database.getClassesBySchoolId(id);
    const classesWithDetails = await Promise.all(classes.map(async cls => {
      const teacher = cls.teacherId ? await database.getById("teachers", cls.teacherId) as any : null;
      const students = await database.getStudentsByClassId(cls.id);
      
      return {
        id: cls.id,
        name: cls.name,
        teacher: teacher ? { id: teacher.id, name: teacher.name } : null,
        studentsCount: students.length,
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
    console.error("Error getting school classes:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get school classes",
        statusCode: 500
      }
    });
  }
};

// GET /api/schools/:id/teachers - Get teachers for a specific school
export const getSchoolTeachers: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    const school = await database.getById<School>("schools", id);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "School not found",
          statusCode: 404
        }
      });
    }

    const teachers = await database.getTeachersBySchoolId(id);
    const teachersWithDetails = await Promise.all(teachers.map(async teacher => {
      const teacherClasses = (await database.getAll<Class>("classes"))
        .filter(cls => cls.schoolId === id && cls.teacherId === teacher.id);
      
      return {
        id: teacher.id,
        name: teacher.name,
        subjects: teacher.subjects,
        classesCount: teacherClasses.length,
        qualifications: teacher.qualifications || []
      };
    }));

    res.json({
      success: true,
      data: teachersWithDetails
    });
  } catch (error) {
    console.error("Error getting school teachers:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get school teachers",
        statusCode: 500
      }
    });
  }
};

// GET /api/schools/:id/students - Get students for a specific school
export const getSchoolStudents: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    const school = await database.getById<School>("schools", id);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "School not found",
          statusCode: 404
        }
      });
    }

    const schoolClasses = await database.getClassesBySchoolId(id);
    const studentIds = new Set<number>();
    const studentClasses = new Map<number, string[]>();

    // Collect all unique students from school classes
    await Promise.all(schoolClasses.map(async cls => {
      const classStudents = await database.getStudentsByClassId(cls.id);
      classStudents.forEach(student => {
        studentIds.add(student.id);
        if (!studentClasses.has(student.id)) {
          studentClasses.set(student.id, []);
        }
        studentClasses.get(student.id)!.push(cls.name);
      });
    }));

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
    
    const validStudents = students.filter(Boolean);

    res.json({
      success: true,
      data: validStudents
    });
  } catch (error) {
    console.error("Error getting school students:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get school students",
        statusCode: 500
      }
    });
  }
};
