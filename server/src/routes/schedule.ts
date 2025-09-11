import { RequestHandler } from "express";
import { z } from "zod";
import { database } from "../database";
import {
  ScheduleResponse,
  WeeklyScheduleResponse,
  ApiResponse,
  ClassSchedule,
  Class,
  School,
  Teacher,
  Subject,
  Student
} from "../../../shared/api";

// =====================================
// Validation Schemas
// =====================================

const scheduleQuerySchema = z.object({
  schoolId: z.string().transform(val => parseInt(val)).optional(),
  teacherId: z.string().transform(val => parseInt(val)).optional(),
  classId: z.string().transform(val => parseInt(val)).optional(),
  dayOfWeek: z.string().transform(val => parseInt(val)).optional(),
  room: z.string().optional()
});

// =====================================
// Helper Functions
// =====================================

function getDayNames(): string[] {
  return ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
}

async function mapScheduleToResponse(schedule: ClassSchedule[]): Promise<ScheduleResponse[]> {
  const groupedByClass = new Map<number, ClassSchedule[]>();
  
  // Group schedules by class
  schedule.forEach(item => {
    if (!groupedByClass.has(item.classId)) {
      groupedByClass.set(item.classId, []);
    }
    groupedByClass.get(item.classId)!.push(item);
  });

  const result = [];
  for (const [classId, classSchedule] of groupedByClass.entries()) {
    const cls = await database.getById<Class>("classes", classId);
    const school = cls ? await database.getById<School>("schools", cls.schoolId) : null;
    const teacher = cls?.teacherId ? await database.getById<Teacher>("teachers", cls.teacherId) : null;
    const students = cls ? await database.getStudentsByClassId(cls.id) : [];

    result.push({
      classId,
      className: cls ? cls.name : "Unknown Class",
      school: school ? { id: school.id, name: school.name } : { id: 0, name: "Unknown" },
      teacher: teacher ? { id: teacher.id, name: teacher.name } : { id: 0, name: "Не назначен" },
      schedule: classSchedule,
      students: students.map(student => ({ id: student.id, name: student.name }))
    });
  }

  return result;
}

async function applyFilters(schedules: ClassSchedule[], filters: any): Promise<ClassSchedule[]> {
  let filtered = schedules;

  if (filters.schoolId) {
    const schoolFiltered = [];
    for (const schedule of filtered) {
      const cls = await database.getById<Class>("classes", schedule.classId);
      if (cls && cls.schoolId === filters.schoolId) {
        schoolFiltered.push(schedule);
      }
    }
    filtered = schoolFiltered;
  }

  if (filters.teacherId) {
    const teacherFiltered = [];
    for (const schedule of filtered) {
      const cls = await database.getById<Class>("classes", schedule.classId);
      if (cls && cls.teacherId === filters.teacherId) {
        teacherFiltered.push(schedule);
      }
    }
    filtered = teacherFiltered;
  }

  if (filters.classId) {
    filtered = filtered.filter(schedule => schedule.classId === filters.classId);
  }

  if (filters.dayOfWeek !== undefined) {
    filtered = filtered.filter(schedule => schedule.dayOfWeek === filters.dayOfWeek);
  }

  if (filters.room) {
    const roomLower = filters.room.toLowerCase();
    filtered = filtered.filter(schedule => 
      schedule.room && schedule.room.toLowerCase().includes(roomLower)
    );
  }

  return filtered;
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

async function checkScheduleConflicts(schedule: ClassSchedule, excludeId?: number): Promise<string[]> {
  const conflicts: string[] = [];
  const allSchedules = await database.getAll<ClassSchedule>("schedules");

  // Check for time conflicts on the same day
  const sameDay = allSchedules.filter(s => 
    s.dayOfWeek === schedule.dayOfWeek && 
    s.id !== excludeId
  );

  for (const existing of sameDay) {
    const existingStart = new Date(`1970-01-01T${existing.startTime}:00`);
    const existingEnd = new Date(`1970-01-01T${existing.endTime}:00`);
    const newStart = new Date(`1970-01-01T${schedule.startTime}:00`);
    const newEnd = new Date(`1970-01-01T${schedule.endTime}:00`);

    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      const existingClass = await database.getById<Class>("classes", existing.classId);
      const newClass = await database.getById<Class>("classes", schedule.classId);
      
      // Room conflict
      if (existing.room && schedule.room && 
          existing.room.toLowerCase() === schedule.room.toLowerCase()) {
        conflicts.push(`Room conflict: ${schedule.room} is already booked at ${formatTimeRange(existing.startTime, existing.endTime)} for class ${existingClass?.name || 'Unknown'}`);
      }
      
      // Teacher conflict (if same teacher)
      if (existingClass?.teacherId && newClass?.teacherId && 
          existingClass.teacherId === newClass.teacherId) {
        const teacher = await database.getById<Teacher>("teachers", existingClass.teacherId);
        conflicts.push(`Teacher conflict: ${teacher?.name || 'Unknown teacher'} is already scheduled at ${formatTimeRange(existing.startTime, existing.endTime)}`);
      }
    }
  }

  return conflicts;
}

// =====================================
// Route Handlers
// =====================================

// GET /api/schedule - Get schedule with filtering
export const getSchedule: RequestHandler = async (req, res) => {
  try {
    const validation = scheduleQuerySchema.safeParse(req.query);
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

    const filters = validation.data;
    let schedules = await database.getAll<ClassSchedule>("schedules");
    
    // Apply filters
    schedules = await applyFilters(schedules, filters);
    
    // Sort by day and time
    schedules.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    const scheduleResponse = await mapScheduleToResponse(schedules);

    const response: ApiResponse<ScheduleResponse[]> = {
      success: true,
      data: scheduleResponse
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting schedule:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get schedule",
        statusCode: 500
      }
    });
  }
};

// GET /api/schedule/weekly - Get weekly schedule overview
export const getWeeklySchedule: RequestHandler = async (req, res) => {
  try {
    const validation = scheduleQuerySchema.safeParse(req.query);
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

    const filters = validation.data;
    let schedules = await database.getAll<ClassSchedule>("schedules");
    
    // Apply filters
    schedules = await applyFilters(schedules, filters);

    const scheduleResponse = await mapScheduleToResponse(schedules);
    const dayNames = getDayNames();

    const weeklyResponse: WeeklyScheduleResponse = {
      schedule: scheduleResponse,
      dayNames
    };

    const response: ApiResponse<WeeklyScheduleResponse> = {
      success: true,
      data: weeklyResponse
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting weekly schedule:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get weekly schedule",
        statusCode: 500
      }
    });
  }
};

// GET /api/schedule/class/:id - Get schedule for specific class
export const getClassSchedule: RequestHandler = async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    if (isNaN(classId)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid class ID",
          statusCode: 400
        }
      });
    }

    const cls = await database.getById<Class>("classes", classId);
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

    const schedules = await database.getSchedulesByClassId(classId);
    const schedulesWithDetails = [];
    
    for (const schedule of schedules) {
      const subject = await database.getById<Subject>("subjects", schedule.subjectId);
      schedulesWithDetails.push({
        ...schedule,
        subject: subject ? {
          id: subject.id,
          name: subject.name,
          nameArabic: subject.nameArabic,
          category: subject.category
        } : null,
        dayName: getDayNames()[schedule.dayOfWeek],
        timeRange: formatTimeRange(schedule.startTime, schedule.endTime)
      });
    }
    
    schedulesWithDetails.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    res.json({
      success: true,
      data: {
        classId,
        className: cls.name,
        schedule: schedulesWithDetails
      }
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

// GET /api/schedule/teacher/:id - Get schedule for specific teacher
export const getTeacherSchedule: RequestHandler = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    if (isNaN(teacherId)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid teacher ID",
          statusCode: 400
        }
      });
    }

    const teacher = await database.getById<Teacher>("teachers", teacherId);
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

    // Get all classes taught by this teacher
    const allClasses = await database.getAll<Class>("classes");
    const teacherClasses = allClasses.filter(cls => cls.teacherId === teacherId);
    const allSchedules: any[] = [];

    for (const cls of teacherClasses) {
      const classSchedules = await database.getSchedulesByClassId(cls.id);
      const school = await database.getById<School>("schools", cls.schoolId);
      
      for (const schedule of classSchedules) {
        const subject = await database.getById<Subject>("subjects", schedule.subjectId);
        allSchedules.push({
          ...schedule,
          className: cls.name,
          school: school ? school.name : "Unknown",
          subject: subject ? {
            id: subject.id,
            name: subject.name,
            nameArabic: subject.nameArabic
          } : null,
          dayName: getDayNames()[schedule.dayOfWeek],
          timeRange: formatTimeRange(schedule.startTime, schedule.endTime)
        });
      }
    }

    // Sort by day and time
    allSchedules.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    res.json({
      success: true,
      data: {
        teacherId,
        teacherName: teacher.name,
        totalClasses: teacherClasses.length,
        schedule: allSchedules
      }
    });
  } catch (error) {
    console.error("Error getting teacher schedule:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get teacher schedule",
        statusCode: 500
      }
    });
  }
};

// GET /api/schedule/school/:id - Get schedule for specific school
export const getSchoolSchedule: RequestHandler = async (req, res) => {
  try {
    const schoolId = parseInt(req.params.id);
    if (isNaN(schoolId)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid school ID",
          statusCode: 400
        }
      });
    }

    const school = await database.getById<School>("schools", schoolId);
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

    const schoolClasses = await database.getClassesBySchoolId(schoolId);
    const allSchedules: any[] = [];

    for (const cls of schoolClasses) {
      const classSchedules = await database.getSchedulesByClassId(cls.id);
      const teacher = cls.teacherId ? await database.getById<Teacher>("teachers", cls.teacherId) : null;
      
      for (const schedule of classSchedules) {
        const subject = await database.getById<Subject>("subjects", schedule.subjectId);
        allSchedules.push({
          ...schedule,
          classId: cls.id,
          className: cls.name,
          teacher: teacher ? teacher.name : "Не назначен",
          subject: subject ? {
            id: subject.id,
            name: subject.name,
            nameArabic: subject.nameArabic
          } : null,
          dayName: getDayNames()[schedule.dayOfWeek],
          timeRange: formatTimeRange(schedule.startTime, schedule.endTime)
        });
      }
    }

    // Sort by day, time, and class name
    allSchedules.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return a.className.localeCompare(b.className);
    });

    // Group by day for better organization
    const scheduleByDay = getDayNames().map((dayName, dayIndex) => ({
      day: dayName,
      dayIndex,
      classes: allSchedules.filter(schedule => schedule.dayOfWeek === dayIndex)
    }));

    res.json({
      success: true,
      data: {
        schoolId,
        schoolName: school.name,
        totalClasses: schoolClasses.length,
        scheduleByDay,
        allSchedules
      }
    });
  } catch (error) {
    console.error("Error getting school schedule:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get school schedule",
        statusCode: 500
      }
    });
  }
};

// POST /api/schedule/validate - Validate schedule before creating
export const validateSchedule: RequestHandler = async (req, res) => {
  try {
    const { classId, subjectId, dayOfWeek, startTime, endTime, room } = req.body;

    if (!classId || !subjectId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Missing required fields",
          statusCode: 400
        }
      });
    }

    // Validate time format and logic
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid time format. Use HH:MM format",
          statusCode: 400
        }
      });
    }

    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "End time must be after start time",
          statusCode: 400
        }
      });
    }

    // Check for conflicts
    const tempSchedule: ClassSchedule = {
      id: 0, // Temporary ID for validation
      classId,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room
    };

    const conflicts = await checkScheduleConflicts(tempSchedule);

    res.json({
      success: true,
      data: {
        valid: conflicts.length === 0,
        conflicts,
        schedule: tempSchedule
      }
    });
  } catch (error) {
    console.error("Error validating schedule:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to validate schedule",
        statusCode: 500
      }
    });
  }
};

// GET /api/schedule/conflicts - Get all scheduling conflicts
export const getScheduleConflicts: RequestHandler = async (req, res) => {
  try {
    const allSchedules = await database.getAll<ClassSchedule>("schedules");
    const conflicts: any[] = [];

    for (const schedule of allSchedules) {
      const scheduleConflicts = await checkScheduleConflicts(schedule, schedule.id);
      if (scheduleConflicts.length > 0) {
        const cls = await database.getById<Class>("classes", schedule.classId);
        const subject = await database.getById<Subject>("subjects", schedule.subjectId);
        
        conflicts.push({
          scheduleId: schedule.id,
          className: cls?.name || "Unknown",
          subjectName: subject?.name || "Unknown",
          dayOfWeek: schedule.dayOfWeek,
          dayName: getDayNames()[schedule.dayOfWeek],
          timeRange: formatTimeRange(schedule.startTime, schedule.endTime),
          room: schedule.room,
          conflicts: scheduleConflicts
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalConflicts: conflicts.length,
        conflicts
      }
    });
  } catch (error) {
    console.error("Error getting schedule conflicts:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get schedule conflicts",
        statusCode: 500
      }
    });
  }
};

// GET /api/schedule/rooms - Get room utilization
export const getRoomUtilization: RequestHandler = async (req, res) => {
  try {
    const allSchedules = await database.getAll<ClassSchedule>("schedules");
    const roomUtilization = new Map<string, any>();

    for (const schedule of allSchedules) {
      if (!schedule.room) continue;

      const roomKey = schedule.room.toLowerCase();
      if (!roomUtilization.has(roomKey)) {
        roomUtilization.set(roomKey, {
          room: schedule.room,
          totalHours: 0,
          sessions: [],
          conflicts: []
        });
      }

      const room = roomUtilization.get(roomKey)!;
      const cls = await database.getById<Class>("classes", schedule.classId);
      const subject = await database.getById<Subject>("subjects", schedule.subjectId);
      
      // Calculate duration
      const start = new Date(`1970-01-01T${schedule.startTime}:00`);
      const end = new Date(`1970-01-01T${schedule.endTime}:00`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours

      room.totalHours += duration;
      room.sessions.push({
        classId: schedule.classId,
        className: cls?.name || "Unknown",
        subjectName: subject?.name || "Unknown",
        dayOfWeek: schedule.dayOfWeek,
        dayName: getDayNames()[schedule.dayOfWeek],
        timeRange: formatTimeRange(schedule.startTime, schedule.endTime),
        duration
      });

      // Check for conflicts
      const conflicts = await checkScheduleConflicts(schedule, schedule.id);
      if (conflicts.length > 0) {
        room.conflicts.push(...conflicts);
      }
    }

    const roomData = Array.from(roomUtilization.values())
      .sort((a, b) => b.totalHours - a.totalHours);

    res.json({
      success: true,
      data: {
        totalRooms: roomData.length,
        rooms: roomData
      }
    });
  } catch (error) {
    console.error("Error getting room utilization:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get room utilization",
        statusCode: 500
      }
    });
  }
};
