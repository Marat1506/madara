import "dotenv/config";
import express from "express";
import cors from "cors";
import { database } from "./database";

// Import API route handlers
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentClasses
} from "./routes/students";

import {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolClasses,
  getSchoolTeachers,
  getSchoolStudents
} from "./routes/schools";

import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassSchedule
} from "./routes/classes";

import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  getTeacherStudents
} from "./routes/teachers";

import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByCategory,
  getPredefinedSubjects,
  bulkCreateSubjects
} from "./routes/subjects";

import {
  getEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  bulkCreateEnrollments,
  transferStudent
} from "./routes/enrollments";

import {
  getDashboardStats,
  getDashboardOverview,
  getSchoolStats,
  getTeacherStats,
  getAcademicYears
} from "./routes/dashboard";

import {
  getSchedule,
  getWeeklySchedule,
  getClassSchedule as getClassScheduleDetailed,
  getTeacherSchedule,
  getSchoolSchedule,
  validateSchedule,
  getScheduleConflicts,
  getRoomUtilization
} from "./routes/schedule";

import {
  login,
  getCurrentUser,
  logout,
  validateSessionRoute,
  authenticateToken,
  requireAdmin,
  requirePermission,
  getUsers,
  createUserRoute,
  updateUserRoute,
  deleteUserRoute
} from "./routes/auth";

import { handleDemo, handleDemoSave } from "./routes/demo";

// Export createServer function for reuse
export function createServer() {
  const app = express();

  // CORS configuration for frontend-backend communication
  const corsOptions = {
    origin: [
      "http://localhost:3000", // Client development server
      "http://127.0.0.1:3000",
      "http://localhost:5173", // Alternative Vite port
      "http://127.0.0.1:5173"
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

// Basic API routes
app.get("/api/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.json({ message: ping });
});

app.get("/api/demo", handleDemo);
app.post("/api/demo/save", handleDemoSave);

// =====================================
// Authentication API Routes
// =====================================
app.post("/api/auth/login", login);
app.get("/api/auth/me", getCurrentUser);
app.post("/api/auth/logout", logout);
app.get("/api/auth/session", authenticateToken, validateSessionRoute);

// User Management Routes (Admin only)
app.get("/api/auth/users", authenticateToken, requireAdmin, getUsers);
app.post("/api/auth/users", authenticateToken, requireAdmin, createUserRoute);
app.put("/api/auth/users/:username", authenticateToken, requireAdmin, updateUserRoute);
app.delete("/api/auth/users/:username", authenticateToken, requireAdmin, deleteUserRoute);

// =====================================
// Students API Routes (Protected)
// =====================================
app.get("/api/students", authenticateToken, getStudents);
app.get("/api/students/:id", authenticateToken, getStudentById);
app.post("/api/students", authenticateToken, requireAdmin, createStudent);
app.put("/api/students/:id", authenticateToken, requireAdmin, updateStudent);
app.delete("/api/students/:id", authenticateToken, requireAdmin, deleteStudent);
app.get("/api/students/:id/classes", authenticateToken, getStudentClasses);

// =====================================
// Schools API Routes (Protected)
// =====================================
app.get("/api/schools", authenticateToken, getSchools);
app.get("/api/schools/:id", authenticateToken, getSchoolById);
app.post("/api/schools", authenticateToken, requireAdmin, createSchool);
app.put("/api/schools/:id", authenticateToken, requireAdmin, updateSchool);
app.delete("/api/schools/:id", authenticateToken, requireAdmin, deleteSchool);
app.get("/api/schools/:id/classes", authenticateToken, getSchoolClasses);
app.get("/api/schools/:id/teachers", authenticateToken, getSchoolTeachers);
app.get("/api/schools/:id/students", authenticateToken, getSchoolStudents);

// =====================================
// Classes API Routes (Protected)
// =====================================
app.get("/api/classes", authenticateToken, getClasses);
app.get("/api/classes/:id", authenticateToken, getClassById);
app.post("/api/classes", authenticateToken, requireAdmin, createClass);
app.put("/api/classes/:id", authenticateToken, requireAdmin, updateClass);
app.delete("/api/classes/:id", authenticateToken, requireAdmin, deleteClass);
app.get("/api/classes/:id/students", authenticateToken, getClassStudents);
app.get("/api/classes/:id/schedule", authenticateToken, getClassSchedule);

// =====================================
// Teachers API Routes (Protected)
// =====================================
app.get("/api/teachers", authenticateToken, getTeachers);
app.get("/api/teachers/:id", authenticateToken, getTeacherById);
app.post("/api/teachers", authenticateToken, requireAdmin, createTeacher);
app.put("/api/teachers/:id", authenticateToken, requireAdmin, updateTeacher);
app.delete("/api/teachers/:id", authenticateToken, requireAdmin, deleteTeacher);
app.get("/api/teachers/:id/classes", authenticateToken, getTeacherClasses);
app.get("/api/teachers/:id/students", authenticateToken, getTeacherStudents);

// =====================================
// Subjects API Routes (Protected)
// =====================================
app.get("/api/subjects", authenticateToken, getSubjects);
app.get("/api/subjects/:id", authenticateToken, getSubjectById);
app.post("/api/subjects", authenticateToken, requireAdmin, createSubject);
app.put("/api/subjects/:id", authenticateToken, requireAdmin, updateSubject);
app.delete("/api/subjects/:id", authenticateToken, requireAdmin, deleteSubject);
app.get("/api/subjects/categories", authenticateToken, getSubjectsByCategory);
app.get("/api/subjects/predefined", authenticateToken, getPredefinedSubjects);
app.post("/api/subjects/bulk-create", authenticateToken, requireAdmin, bulkCreateSubjects);

// =====================================
// Enrollments API Routes (Protected)
// =====================================
app.get("/api/enrollments", authenticateToken, getEnrollments);
app.get("/api/enrollments/:id", authenticateToken, getEnrollmentById);
app.post("/api/enrollments", authenticateToken, requireAdmin, createEnrollment);
app.put("/api/enrollments/:id", authenticateToken, requireAdmin, updateEnrollment);
app.delete("/api/enrollments/:id", authenticateToken, requireAdmin, deleteEnrollment);
app.post("/api/enrollments/bulk", authenticateToken, requireAdmin, bulkCreateEnrollments);
// app.put("/api/enrollments/:id/transfer", authenticateToken, requireAdmin, transferStudent);

// =====================================
// Dashboard/Analytics API Routes (Protected)
// =====================================
app.get("/api/dashboard/stats", authenticateToken, getDashboardStats);
app.get("/api/dashboard/overview", authenticateToken, getDashboardOverview);
app.get("/api/dashboard/school/:id/stats", authenticateToken, getSchoolStats);
app.get("/api/dashboard/teacher/:id/stats", authenticateToken, getTeacherStats);
app.get("/api/dashboard/academic-years", authenticateToken, getAcademicYears);

// =====================================
// Schedule API Routes (Protected)
// =====================================
app.get("/api/schedule", authenticateToken, getSchedule);
app.get("/api/schedule/weekly", authenticateToken, getWeeklySchedule);
app.get("/api/schedule/class/:id", authenticateToken, getClassScheduleDetailed);
app.get("/api/schedule/teacher/:id", authenticateToken, getTeacherSchedule);
app.get("/api/schedule/school/:id", authenticateToken, getSchoolSchedule);
app.post("/api/schedule/validate", authenticateToken, requireAdmin, validateSchedule);
app.get("/api/schedule/conflicts", authenticateToken, getScheduleConflicts);
app.get("/api/schedule/rooms", authenticateToken, getRoomUtilization);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  });
});

  // 404 handler (must be the last middleware; no path to avoid path-to-regexp issues)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Route ${req.originalUrl} not found`,
        statusCode: 404
      }
    });
  });

  return app;
}

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting eMadrasa server...');
    
    // Initialize database connection
    await database.init();
    
    // Create and start server
    const app = createServer();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🔗 Frontend should connect from http://localhost:3000`);
      console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
