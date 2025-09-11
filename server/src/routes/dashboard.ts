import { RequestHandler } from "express";
import { database } from "../database";
import {
  DashboardStats,
  ApiResponse,
  School,
  Teacher,
  Class,
  Student,
  Enrollment,
  Subject
} from "../../../shared/api";

// =====================================
// Helper Functions
// =====================================

function getMonthName(monthNumber: number): string {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return months[monthNumber] || "Unknown";
}

async function getEnrollmentTrends(): Promise<{ month: string; enrollments: number }[]> {
  const enrollments = await database.getAll<Enrollment>("enrollments");
  const monthlyData = new Map<string, number>();

  // Initialize last 12 months
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = getMonthName(date.getMonth());
    monthlyData.set(key, 0);
  }

  // Count enrollments by month
  enrollments.forEach(enrollment => {
    const enrollmentDate = new Date(enrollment.enrollmentDate);
    const key = `${enrollmentDate.getFullYear()}-${String(enrollmentDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyData.has(key)) {
      monthlyData.set(key, (monthlyData.get(key) || 0) + 1);
    }
  });

  // Convert to array format
  return Array.from(monthlyData.entries()).map(([key, count]) => {
    const [year, month] = key.split('-');
    const monthNumber = parseInt(month) - 1;
    return {
      month: getMonthName(monthNumber),
      enrollments: count
    };
  });
}

async function getStudentsPerSchool(): Promise<{ schoolName: string; count: number }[]> {
  const schools = await database.getAll<School>("schools");
  
  const results = await Promise.all(schools.map(async school => {
    const schoolClasses = await database.getClassesBySchoolId(school.id);
    const uniqueStudentIds = new Set<number>();
    
    await Promise.all(schoolClasses.map(async cls => {
      const classStudents = await database.getStudentsByClassId(cls.id);
      classStudents.forEach(student => uniqueStudentIds.add(student.id));
    }));

    return {
      schoolName: school.name,
      count: uniqueStudentIds.size
    };
  }));
  
  return results.sort((a, b) => b.count - a.count);
}

async function getStudentsPerClass(): Promise<{ className: string; count: number }[]> {
  const classes = await database.getAll<Class>("classes");
  
  const results = await Promise.all(classes.map(async cls => {
    const classStudents = await database.getStudentsByClassId(cls.id);
    const school = await database.getById<School>("schools", cls.schoolId);
    
    return {
      className: `${cls.name} (${school?.name || 'Unknown'})`,
      count: classStudents.length
    };
  }));
  
  return results.sort((a, b) => b.count - a.count);
}

async function getSubjectDistribution(): Promise<{ subjectName: string; count: number }[]> {
  const classes = await database.getAll<Class>("classes");
  const subjects = await database.getAll<Subject>("subjects");
  const subjectCounts = new Map<number, number>();

  // Count how many classes each subject is taught in
  classes.forEach(cls => {
    cls.subjectIds.forEach(subjectId => {
      subjectCounts.set(subjectId, (subjectCounts.get(subjectId) || 0) + 1);
    });
  });

  return subjects.map(subject => ({
    subjectName: subject.name,
    count: subjectCounts.get(subject.id) || 0
  })).filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

async function getGenderDistribution(): Promise<{ male: number; female: number }> {
  const students = await database.getAll<Student>("students");
  
  return students.reduce((acc, student) => {
    if (student.gender === "male") {
      acc.male++;
    } else if (student.gender === "female") {
      acc.female++;
    }
    return acc;
  }, { male: 0, female: 0 });
}

async function getRecentEnrollments(limit: number = 10): Promise<DashboardStats["recentEnrollments"]> {
  const enrollments = (await database.getAll<Enrollment>("enrollments"))
    .filter(enrollment => enrollment.status === "active")
    .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
    .slice(0, limit);

  const results = await Promise.all(enrollments.map(async enrollment => {
    const student = await database.getById<Student>("students", enrollment.studentId);
    const cls = await database.getById<Class>("classes", enrollment.classId);
    const school = cls ? await database.getById<School>("schools", cls.schoolId) : null;

    return {
      id: enrollment.id,
      studentName: student ? student.fullName : "Unknown Student",
      className: cls ? cls.name : "Unknown Class",
      schoolName: school ? school.name : "Unknown School",
      date: enrollment.enrollmentDate
    };
  }));
  
  return results;
}

// =====================================
// Route Handlers
// =====================================

// GET /api/dashboard/stats - Get dashboard statistics
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const schools = await database.getAll<School>("schools");
    const teachers = await database.getAll<Teacher>("teachers");
    const classes = await database.getAll<Class>("classes");
    const students = await database.getAll<Student>("students");
    const enrollments = await database.getAll<Enrollment>("enrollments");

    const activeEnrollments = enrollments.filter(enrollment => enrollment.status === "active");

    const stats: DashboardStats = {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSchools: schools.length,
      activeEnrollments: activeEnrollments.length,
      studentsPerSchool: await getStudentsPerSchool(),
      studentsPerClass: await getStudentsPerClass(),
      subjectDistribution: await getSubjectDistribution(),
      enrollmentTrends: await getEnrollmentTrends(),
      genderDistribution: await getGenderDistribution(),
      recentEnrollments: await getRecentEnrollments()
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get dashboard statistics",
        statusCode: 500
      }
    });
  }
};

// GET /api/dashboard/overview - Get quick overview stats
export const getDashboardOverview: RequestHandler = async (req, res) => {
  try {
    const schools = await database.getAll<School>("schools");
    const teachers = await database.getAll<Teacher>("teachers");
    const classes = await database.getAll<Class>("classes");
    const students = await database.getAll<Student>("students");
    const enrollments = await database.getAll<Enrollment>("enrollments");

    const activeEnrollments = enrollments.filter(enrollment => enrollment.status === "active");
    const recentEnrollments = enrollments.filter(enrollment => {
      const enrollmentDate = new Date(enrollment.enrollmentDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return enrollmentDate >= thirtyDaysAgo;
    });

    const overview = {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSchools: schools.length,
      activeEnrollments: activeEnrollments.length,
      recentEnrollments: recentEnrollments.length,
      averageClassSize: classes.length > 0 ? Math.round(activeEnrollments.length / classes.length) : 0,
      utilizationRate: classes.reduce((acc, cls) => acc + cls.currentStudents, 0) / 
                     classes.reduce((acc, cls) => acc + cls.maxStudents, 1) * 100
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error("Error getting dashboard overview:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get dashboard overview",
        statusCode: 500
      }
    });
  }
};

// GET /api/dashboard/school/:id/stats - Get statistics for a specific school
export const getSchoolStats: RequestHandler = async (req, res) => {
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
    const schoolTeachers = await database.getTeachersBySchoolId(schoolId);
    
    // Get unique students
    const uniqueStudentIds = new Set<number>();
    await Promise.all(schoolClasses.map(async cls => {
      const classStudents = await database.getStudentsByClassId(cls.id);
      classStudents.forEach(student => uniqueStudentIds.add(student.id));
    }));

    const students = await Promise.all(Array.from(uniqueStudentIds).map(async studentId => 
      await database.getById<Student>("students", studentId)
    ));
    const validStudents = students.filter(Boolean);

    // Gender distribution for this school
    const genderDistribution = validStudents.reduce((acc, student) => {
      if (student?.gender === "male") {
        acc.male++;
      } else if (student?.gender === "female") {
        acc.female++;
      }
      return acc;
    }, { male: 0, female: 0 });

    // Classes with enrollment counts
    const classesWithEnrollment = await Promise.all(schoolClasses.map(async cls => {
      const classStudents = await database.getStudentsByClassId(cls.id);
      return {
        id: cls.id,
        name: cls.name,
        currentStudents: classStudents.length,
        maxStudents: cls.maxStudents,
        utilizationRate: Math.round((classStudents.length / cls.maxStudents) * 100)
      };
    }));

    const schoolStats = {
      school: {
        id: school.id,
        name: school.name,
        type: school.type,
        foundedYear: school.foundedYear
      },
      totalStudents: validStudents.length,
      totalTeachers: schoolTeachers.length,
      totalClasses: schoolClasses.length,
      genderDistribution,
      classes: classesWithEnrollment,
      averageClassSize: schoolClasses.length > 0 ? Math.round(validStudents.length / schoolClasses.length) : 0,
      overallUtilization: schoolClasses.reduce((acc, cls) => acc + cls.currentStudents, 0) / 
                         schoolClasses.reduce((acc, cls) => acc + cls.maxStudents, 1) * 100
    };

    res.json({
      success: true,
      data: schoolStats
    });
  } catch (error) {
    console.error("Error getting school stats:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get school statistics",
        statusCode: 500
      }
    });
  }
};

// GET /api/dashboard/teacher/:id/stats - Get statistics for a specific teacher
export const getTeacherStats: RequestHandler = async (req, res) => {
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

    const teacherClasses = (await database.getAll<Class>("classes")).filter(cls => cls.teacherId === teacherId);
    
    // Get unique students across all teacher's classes
    const uniqueStudentIds = new Set<number>();
    await Promise.all(teacherClasses.map(async cls => {
      const classStudents = await database.getStudentsByClassId(cls.id);
      classStudents.forEach(student => uniqueStudentIds.add(student.id));
    }));

    const students = await Promise.all(Array.from(uniqueStudentIds).map(async studentId => 
      await database.getById<Student>("students", studentId)
    ));
    const validStudents = students.filter(Boolean);

    // Classes with details
    const classesWithDetails = await Promise.all(teacherClasses.map(async cls => {
      const classStudents = await database.getStudentsByClassId(cls.id);
      const school = await database.getById<School>("schools", cls.schoolId);
      
      return {
        id: cls.id,
        name: cls.name,
        school: school ? school.name : "Unknown",
        currentStudents: classStudents.length,
        maxStudents: cls.maxStudents,
        subjects: cls.subjectIds.length
      };
    }));

    const teacherStats = {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        subjects: teacher.subjects,
        qualifications: teacher.qualifications || []
      },
      totalClasses: teacherClasses.length,
      totalStudents: validStudents.length,
      schoolsCount: teacher.schoolIds.length,
      classes: classesWithDetails,
      averageClassSize: teacherClasses.length > 0 ? Math.round(validStudents.length / teacherClasses.length) : 0
    };

    res.json({
      success: true,
      data: teacherStats
    });
  } catch (error) {
    console.error("Error getting teacher stats:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get teacher statistics",
        statusCode: 500
      }
    });
  }
};

// GET /api/dashboard/academic-years - Get available academic years
export const getAcademicYears: RequestHandler = async (req, res) => {
  try {
    const enrollments = await database.getAll<Enrollment>("enrollments");
    const classes = await database.getAll<Class>("classes");
    
    const academicYears = new Set<string>();
    
    enrollments.forEach(enrollment => {
      academicYears.add(enrollment.academicYear);
    });
    
    classes.forEach(cls => {
      academicYears.add(cls.academicYear);
    });

    const sortedYears = Array.from(academicYears).sort().reverse();

    res.json({
      success: true,
      data: sortedYears
    });
  } catch (error) {
    console.error("Error getting academic years:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get academic years",
        statusCode: 500
      }
    });
  }
};
