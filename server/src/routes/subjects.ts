import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  SubjectsListResponse,
  PaginationParams,
  ApiResponse,
  Subject,
  ISLAMIC_SUBJECTS
} from "../../../shared/api";

// =====================================
// Validation Schemas
// =====================================

const createSubjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  nameArabic: z.string().max(200).optional(),
  category: z.enum(["quran", "hadith", "fiqh", "aqidah", "arabic", "other"]),
  description: z.string().max(500).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"])
});

const updateSubjectSchema = createSubjectSchema.partial();

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  category: z.enum(["quran", "hadith", "fiqh", "aqidah", "arabic", "other"]).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional()
});

// =====================================
// Helper Functions
// =====================================

function applyFilters(subjects: Subject[], filters: any): Subject[] {
  let filtered = subjects;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(subject => 
      subject.name.toLowerCase().includes(searchLower) ||
      (subject.nameArabic && subject.nameArabic.toLowerCase().includes(searchLower)) ||
      (subject.description && subject.description.toLowerCase().includes(searchLower))
    );
  }

  if (filters.category) {
    filtered = filtered.filter(subject => subject.category === filters.category);
  }

  if (filters.level) {
    filtered = filtered.filter(subject => subject.level === filters.level);
  }

  return filtered;
}

function applySorting(subjects: Subject[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): Subject[] {
  if (!sortBy) return subjects;

  return subjects.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "category":
        aVal = a.category;
        bVal = b.category;
        break;
      case "level":
        aVal = a.level;
        bVal = b.level;
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

// GET /api/subjects - Get all subjects with filtering and pagination
export const getSubjects: RequestHandler = async (req, res) => {
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

    const { page = 1, limit = 50, sortBy, sortOrder, ...filters } = validation.data;

    let subjects = await database.getAll<Subject>("subjects");
    
    // Apply filters
    subjects = applyFilters(subjects, filters);
    
    // Apply sorting
    subjects = applySorting(subjects, sortBy, sortOrder);
    
    // Apply pagination
    const { items: paginatedSubjects, total, pagination } = applyPagination(subjects, page, limit);

    const response: ApiResponse<SubjectsListResponse> = {
      success: true,
      data: {
        subjects: paginatedSubjects,
        total
      },
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting subjects:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get subjects",
        statusCode: 500
      }
    });
  }
};

// GET /api/subjects/:id - Get subject by ID
export const getSubjectById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid subject ID",
          statusCode: 400
        }
      });
    }

    const subject = await database.getById<Subject>("subjects", id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Subject not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<Subject> = {
      success: true,
      data: subject
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting subject:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get subject",
        statusCode: 500
      }
    });
  }
};

// POST /api/subjects - Create new subject
export const createSubject: RequestHandler = async (req, res) => {
  try {
    const validation = createSubjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid subject data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const subjectData = validation.data as CreateSubjectRequest;
    
    // Check if subject with the same name already exists
    const existingSubject = (await database.getAll<Subject>("subjects"))
      .find(subject => subject.name.toLowerCase() === subjectData.name.toLowerCase());
    
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Subject with this name already exists",
          statusCode: 400
        }
      });
    }

    // Create the subject
    const newSubject = await database.create<Subject>("subjects", subjectData);

    const response: ApiResponse<Subject> = {
      success: true,
      data: newSubject
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create subject",
        statusCode: 500
      }
    });
  }
};

// PUT /api/subjects/:id - Update subject
export const updateSubject: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid subject ID",
          statusCode: 400
        }
      });
    }

    const validation = updateSubjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid subject data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData: UpdateSubjectRequest = validation.data;
    
    // Check if subject exists
    const existingSubject = await database.getById<Subject>("subjects", id);
    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Subject not found",
          statusCode: 404
        }
      });
    }

    // Check if name is being updated and if it conflicts with another subject
    if (updateData.name && updateData.name.toLowerCase() !== existingSubject.name.toLowerCase()) {
      const nameConflict = (await database.getAll<Subject>("subjects"))
        .find(subject => subject.id !== id && subject.name.toLowerCase() === updateData.name!.toLowerCase());
      
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: {
            error: "Validation Error",
            message: "Subject with this name already exists",
            statusCode: 400
          }
        });
      }
    }

    // Update the subject
    const updatedSubject = await database.update<Subject>("subjects", id, updateData);
    if (!updatedSubject) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to update subject",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<Subject> = {
      success: true,
      data: updatedSubject
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update subject",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/subjects/:id - Delete subject
export const deleteSubject: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid subject ID",
          statusCode: 400
        }
      });
    }

    // Check if subject exists
    const existingSubject = await database.getById<Subject>("subjects", id);
    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "Subject not found",
          statusCode: 404
        }
      });
    }

    // Check if subject is used in any classes
    const subjectClasses = (await database.getAll("classes")).filter((cls: any) => 
      cls.subjectIds.includes(id) || cls.primarySubjectId === id
    );
    
    if (subjectClasses.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete subject that is used in classes. Please remove from classes first.",
          statusCode: 400
        }
      });
    }

    // Check if subject is used in any schedules
    const subjectSchedules = (await database.getAll("schedules")).filter((schedule: any) => 
      schedule.subjectId === id
    );
    
    if (subjectSchedules.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete subject that is used in schedules. Please remove from schedules first.",
          statusCode: 400
        }
      });
    }

    // Delete the subject
    const deleted = await database.delete("subjects", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          error: "Internal Server Error",
          message: "Failed to delete subject",
          statusCode: 500
        }
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Subject deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete subject",
        statusCode: 500
      }
    });
  }
};

// GET /api/subjects/categories - Get subjects grouped by category
export const getSubjectsByCategory: RequestHandler = async (req, res) => {
  try {
    const subjects = await database.getAll<Subject>("subjects");
    
    const categorizedSubjects = subjects.reduce((acc, subject) => {
      if (!acc[subject.category]) {
        acc[subject.category] = [];
      }
      acc[subject.category].push(subject);
      return acc;
    }, {} as Record<string, Subject[]>);

    // Sort subjects within each category
    Object.keys(categorizedSubjects).forEach(category => {
      categorizedSubjects[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    res.json({
      success: true,
      data: categorizedSubjects
    });
  } catch (error) {
    console.error("Error getting subjects by category:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get subjects by category",
        statusCode: 500
      }
    });
  }
};

// GET /api/subjects/predefined - Get predefined Islamic subjects
export const getPredefinedSubjects: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: ISLAMIC_SUBJECTS
    });
  } catch (error) {
    console.error("Error getting predefined subjects:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get predefined subjects",
        statusCode: 500
      }
    });
  }
};

// POST /api/subjects/bulk-create - Create multiple subjects from predefined list
export const bulkCreateSubjects: RequestHandler = async (req, res) => {
  try {
    const { subjectIndices } = req.body;
    
    if (!Array.isArray(subjectIndices)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "subjectIndices must be an array",
          statusCode: 400
        }
      });
    }

    const createdSubjects: Subject[] = [];
    const errors: string[] = [];

    for (const index of subjectIndices) {
      if (index < 0 || index >= ISLAMIC_SUBJECTS.length) {
        errors.push(`Invalid subject index: ${index}`);
        continue;
      }

      const predefinedSubject = ISLAMIC_SUBJECTS[index];
      
      // Check if subject already exists
      const existingSubject = (await database.getAll<Subject>("subjects"))
        .find(subject => subject.name.toLowerCase() === predefinedSubject.name.toLowerCase());
      
      if (existingSubject) {
        errors.push(`Subject "${predefinedSubject.name}" already exists`);
        continue;
      }

      try {
        const newSubject = await database.create<Subject>("subjects", {
          name: predefinedSubject.name,
          nameArabic: predefinedSubject.nameArabic,
          category: predefinedSubject.category,
          level: "beginner", // Default level
          description: `Изучение ${predefinedSubject.name} в соответствии с исламскими традициями`
        });
        createdSubjects.push(newSubject);
      } catch (error) {
        errors.push(`Failed to create subject "${predefinedSubject.name}"`);
      }
    }

    res.json({
      success: true,
      data: {
        created: createdSubjects,
        errors
      }
    });
  } catch (error) {
    console.error("Error bulk creating subjects:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to bulk create subjects",
        statusCode: 500
      }
    });
  }
};
