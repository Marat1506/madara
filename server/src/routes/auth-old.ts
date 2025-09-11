import { RequestHandler } from "express";
import { z } from "zod";
import {
  LoginRequest,
  LoginResponse,
  AuthResponse,
  User,
  ApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersListResponse
} from "../../../shared/api";

// =====================================
// In-memory user store and sessions
// =====================================

interface SessionData {
  userId: string;
  expiresAt: Date;
}

// In-memory sessions store (in production, use Redis or database)
const sessions = new Map<string, SessionData>();

// Predefined users with the specified credentials
const users: Record<string, User> = {
  "UmarAdmin": {
    id: "admin-1",
    username: "UmarAdmin",
    role: "admin",
    name: "Умар Администратор",
    email: "umar.admin@emadrasa.ru",
    schoolIds: [1, 2, 3], // Access to all schools
    permissions: [
      "manage_students",
      "manage_teachers", 
      "manage_classes",
      "manage_schools",
      "view_analytics",
      "manage_schedules",
      "manage_enrollments",
      "manage_users"
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
};

// Predefined passwords (in production, use proper hashing)
const passwords: Record<string, string> = {
  "UmarAdmin": "UmarAdmMadrasa05!"
};

// =====================================
// Validation Schemas
// =====================================

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "teacher"]),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  schoolIds: z.array(z.number()),
  permissions: z.array(z.string()).optional()
});

const updateUserSchema = createUserSchema.partial();

// =====================================
// Utility Functions
// =====================================

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createSession(userId: string): { token: string; expiresAt: Date } {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  sessions.set(token, { userId, expiresAt });
  return { token, expiresAt };
}

function validateSession(token: string): User | null {
  const session = sessions.get(token);
  if (!session) return null;

  if (new Date() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  const user = Object.values(users).find(u => u.id === session.userId);
  return user || null;
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

function generateUserId(): string {
  return "user-" + Date.now() + "-" + Math.random().toString(36).substring(2);
}

function getUserDefaultPermissions(role: "admin" | "teacher"): string[] {
  if (role === "admin") {
    return [
      "manage_students",
      "manage_teachers",
      "manage_classes",
      "manage_schools",
      "view_analytics",
      "manage_schedules",
      "manage_enrollments",
      "manage_users"
    ];
  } else {
    return [
      "view_students",
      "manage_grades",
      "view_classes",
      "view_schedules"
    ];
  }
}

// User management functions
export function createUser(userData: CreateUserRequest): User {
  if (users[userData.username]) {
    throw new Error("Username already exists");
  }

  const userId = generateUserId();
  const now = new Date().toISOString();

  const newUser: User = {
    id: userId,
    username: userData.username,
    role: userData.role,
    name: userData.name,
    email: userData.email || undefined,
    schoolIds: userData.schoolIds,
    permissions: userData.permissions || getUserDefaultPermissions(userData.role),
    createdAt: now,
    updatedAt: now
  };

  users[userData.username] = newUser;
  passwords[userData.username] = userData.password;

  return newUser;
}

export function updateUser(username: string, updateData: UpdateUserRequest): User | null {
  const user = users[username];
  if (!user) return null;

  const now = new Date().toISOString();

  // If username is being changed, update the keys
  if (updateData.username && updateData.username !== username) {
    if (users[updateData.username]) {
      throw new Error("New username already exists");
    }
    delete users[username];
    const oldPassword = passwords[username];
    delete passwords[username];
    passwords[updateData.username] = oldPassword;
  }

  const updatedUser: User = {
    ...user,
    username: updateData.username || user.username,
    role: updateData.role || user.role,
    name: updateData.name || user.name,
    email: updateData.email !== undefined ? updateData.email || undefined : user.email,
    schoolIds: updateData.schoolIds || user.schoolIds,
    permissions: updateData.permissions || user.permissions,
    updatedAt: now
  };

  const finalUsername = updateData.username || username;
  users[finalUsername] = updatedUser;

  if (updateData.password) {
    passwords[finalUsername] = updateData.password;
  }

  return updatedUser;
}

export function deleteUser(username: string): boolean {
  if (!users[username]) return false;

  // Don't allow deleting the main admin
  if (username === "UmarAdmin") {
    throw new Error("Cannot delete the main administrator");
  }

  delete users[username];
  delete passwords[username];

  // Clear any active sessions for this user
  const userId = Object.values(users).find(u => u.username === username)?.id;
  if (userId) {
    Array.from(sessions.entries()).forEach(([token, session]) => {
      if (session.userId === userId) {
        sessions.delete(token);
      }
    });
  }

  return true;
}

export function getAllUsers(): UserResponse[] {
  return Object.values(users).map(user => ({
    ...user,
    hasAccount: true
  }));
}

// =====================================
// Middleware
// =====================================

export const authenticateToken: RequestHandler = (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        error: "Unauthorized",
        message: "Authentication token required",
        statusCode: 401
      }
    });
  }

  const user = validateSession(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        error: "Unauthorized",
        message: "Invalid or expired token",
        statusCode: 401
      }
    });
  }

  // Add user to request object
  (req as any).user = user;
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = (req as any).user as User;
  
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        error: "Forbidden",
        message: "Admin privileges required",
        statusCode: 403
      }
    });
  }

  next();
};

export const requirePermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const user = (req as any).user as User;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          error: "Unauthorized",
          message: "Authentication required",
          statusCode: 401
        }
      });
    }

    if (user.role !== "admin" && !user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          error: "Forbidden",
          message: `Permission '${permission}' required`,
          statusCode: 403
        }
      });
    }

    next();
  };
};

// =====================================
// Route Handlers
// =====================================

// POST /api/auth/login - Login user
export const login: RequestHandler = (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid login data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const { username, password } = validation.data as LoginRequest;

    // Check if user exists and password is correct
    const user = users[username];
    const correctPassword = passwords[username];

    if (!user || !correctPassword || password !== correctPassword) {
      return res.status(401).json({
        success: false,
        error: {
          error: "Authentication Failed",
          message: "Invalid username or password",
          statusCode: 401
        }
      });
    }

    // Create session
    const { token, expiresAt } = createSession(user.id);

    const loginResponse: LoginResponse = {
      user,
      token,
      expiresAt: expiresAt.toISOString()
    };

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: loginResponse
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to process login",
        statusCode: 500
      }
    });
  }
};

// GET /api/auth/me - Get current user
export const getCurrentUser: RequestHandler = (req, res) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.json({
        success: true,
        data: { authenticated: false }
      });
    }

    const user = validateSession(token);
    
    const authResponse: AuthResponse = {
      authenticated: !!user,
      user: user || undefined
    };

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: authResponse
    };

    res.json(response);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get current user",
        statusCode: 500
      }
    });
  }
};

// POST /api/auth/logout - Logout user
export const logout: RequestHandler = (req, res) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      sessions.delete(token);
    }

    res.json({
      success: true,
      data: { message: "Logged out successfully" }
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to logout",
        statusCode: 500
      }
    });
  }
};

// GET /api/auth/session - Validate session
export const validateSessionRoute: RequestHandler = (req, res) => {
  try {
    const user = (req as any).user as User;
    
    res.json({
      success: true,
      data: {
        valid: true,
        user
      }
    });
  } catch (error) {
    console.error("Session validation error:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to validate session",
        statusCode: 500
      }
    });
  }
};

// =====================================
// User Management Route Handlers
// =====================================

// GET /api/auth/users - Get all users (admin only)
export const getUsers: RequestHandler = (req, res) => {
  try {
    const users = getAllUsers();

    const response: ApiResponse<UsersListResponse> = {
      success: true,
      data: {
        users,
        total: users.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to get users",
        statusCode: 500
      }
    });
  }
};

// POST /api/auth/users - Create new user (admin only)
export const createUserRoute: RequestHandler = (req, res) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid user data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const userData = validation.data as CreateUserRequest;
    const newUser = createUser(userData);

    const response: ApiResponse<UserResponse> = {
      success: true,
      data: {
        ...newUser,
        hasAccount: true
      }
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Username already exists") {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Username already exists",
          statusCode: 400
        }
      });
    }

    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to create user",
        statusCode: 500
      }
    });
  }
};

// PUT /api/auth/users/:username - Update user (admin only)
export const updateUserRoute: RequestHandler = (req, res) => {
  try {
    const { username } = req.params;

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Invalid user data",
          statusCode: 400,
          details: validation.error.errors
        }
      });
    }

    const updateData: UpdateUserRequest = validation.data;
    const updatedUser = updateUser(username, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "User not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<UserResponse> = {
      success: true,
      data: {
        ...updatedUser,
        hasAccount: true
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "New username already exists") {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "New username already exists",
          statusCode: 400
        }
      });
    }

    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to update user",
        statusCode: 500
      }
    });
  }
};

// DELETE /api/auth/users/:username - Delete user (admin only)
export const deleteUserRoute: RequestHandler = (req, res) => {
  try {
    const { username } = req.params;

    const deleted = deleteUser(username);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          error: "Not Found",
          message: "User not found",
          statusCode: 404
        }
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "User deleted successfully" }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Cannot delete the main administrator") {
      return res.status(400).json({
        success: false,
        error: {
          error: "Validation Error",
          message: "Cannot delete the main administrator",
          statusCode: 400
        }
      });
    }

    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: {
        error: "Internal Server Error",
        message: "Failed to delete user",
        statusCode: 500
      }
    });
  }
};
