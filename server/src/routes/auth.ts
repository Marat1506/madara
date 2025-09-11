import { RequestHandler } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
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
} from "@shared/api";
import { UserModel } from "../models/User";

// =====================================
// Configuration
// =====================================

const JWT_SECRET = process.env.JWT_SECRET || "emadrasa-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

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
  schoolIds: z.array(z.string()),
  permissions: z.array(z.string()).optional()
});

const updateUserSchema = createUserSchema.partial();

// =====================================
// Utility Functions
// =====================================

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
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

// =====================================
// Seed Admin User
// =====================================

async function ensureAdminUser() {
  try {
    const existingAdmin = await UserModel.findOne({ username: "UmarAdmin" });
    if (!existingAdmin) {
      const adminUser = new UserModel({
        username: "UmarAdmin",
        password: "UmarAdmMadrasa05!",
        role: "admin",
        name: "Умар Администратор",
        email: "umar.admin@emadrasa.ru",
        schoolIds: [], // Will be populated with actual school IDs
        permissions: getUserDefaultPermissions("admin")
      });
      
      await adminUser.save();
      console.log("✅ Default admin user created: UmarAdmin");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
}

// Call this when the module loads
ensureAdminUser();

// =====================================
// Route Handlers
// =====================================

export const login: RequestHandler = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;

    // Find user in database
    const user = await UserModel.findOne({ username }).populate('schoolIds');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid username or password",
          statusCode: 401
        }
      } as ApiResponse<LoginResponse>);
    }

    // Check password
    const isValidPassword = await (user as any).comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid username or password",
          statusCode: 401
        }
      } as ApiResponse<LoginResponse>);
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const loginResponse: LoginResponse = {
      user: (user as any).toJSON() as User,
      token,
      expiresAt: expiresAt.toISOString()
    };

    res.json({
      success: true,
      data: loginResponse
    } as ApiResponse<LoginResponse>);

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        statusCode: 500
      }
    } as ApiResponse<LoginResponse>);
  }
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: "No token provided",
          statusCode: 401
        }
      } as ApiResponse<AuthResponse>);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid token",
          statusCode: 401
        }
      } as ApiResponse<AuthResponse>);
    }

    const user = await UserModel.findById(decoded.userId).populate('schoolIds');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "User not found",
          statusCode: 401
        }
      } as ApiResponse<AuthResponse>);
    }

    const authResponse: AuthResponse = {
      authenticated: true,
      user: (user as any).toJSON() as User
    };

    res.json({
      success: true,
      data: authResponse
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        statusCode: 500
      }
    } as ApiResponse<AuthResponse>);
  }
};

export const logout: RequestHandler = async (req, res) => {
  // With JWT, logout is handled on the client side by removing the token
  res.json({
    success: true,
    data: { message: "Logged out successfully" }
  });
};

export const validateSessionRoute: RequestHandler = async (req, res) => {
  // This middleware is already handled by authenticateToken
  res.json({
    success: true,
    data: { valid: true }
  });
};

// =====================================
// Middleware
// =====================================

export const authenticateToken: RequestHandler = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Access token required",
          statusCode: 401
        }
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid access token",
          statusCode: 401
        }
      });
    }

    const user = await UserModel.findById(decoded.userId).populate('schoolIds');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "User not found",
          statusCode: 401
        }
      });
    }

    // Attach user to request object
    (req as any).user = (user as any).toJSON() as User;
    next();

  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: {
        message: "Authentication failed",
        statusCode: 401
      }
    });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = (req as any).user as User;
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        message: "Admin access required",
        statusCode: 403
      }
    });
  }
  next();
};

export const requirePermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const user = (req as any).user as User;
    if (!user || !user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Permission '${permission}' required`,
          statusCode: 403
        }
      });
    }
    next();
  };
};

// =====================================
// User Management Routes
// =====================================

export const getUsers: RequestHandler = async (req, res) => {
  try {
    const users = await UserModel.find({}).populate('schoolIds');
    const userResponses = users.map(user => {
      const userObj = (user as any).toJSON() as User;
      return {
        ...userObj,
        hasAccount: true
      } as UserResponse;
    });

    const response: UsersListResponse = {
      users: userResponses,
      total: userResponses.length
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse<UsersListResponse>);

  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        statusCode: 500
      }
    });
  }
};

export const createUserRoute: RequestHandler = async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    // Check if username already exists
    const existingUser = await UserModel.findOne({ username: validatedData.username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Username already exists",
          statusCode: 400
        }
      });
    }

    const userData = {
      ...validatedData,
      permissions: validatedData.permissions || getUserDefaultPermissions(validatedData.role)
    };

    const newUser = new UserModel(userData);
    await newUser.save();

    const userResponse: UserResponse = {
      ...(newUser as any).toJSON() as User,
      hasAccount: true
    };

    res.status(201).json({
      success: true,
      data: userResponse
    } as ApiResponse<UserResponse>);

  } catch (error) {
    console.error("Create user error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          statusCode: 400,
          details: error.errors
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        statusCode: 500
      }
    });
  }
};

export const updateUserRoute: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found",
          statusCode: 404
        }
      });
    }

    // If username is changing, check for conflicts
    if (validatedData.username && validatedData.username !== username) {
      const existingUser = await UserModel.findOne({ username: validatedData.username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: "New username already exists",
            statusCode: 400
          }
        });
      }
    }

    // Update user fields
    Object.assign(user, validatedData);
    await user.save();

    const userResponse: UserResponse = {
      ...(user as any).toJSON() as User,
      hasAccount: true
    };

    res.json({
      success: true,
      data: userResponse
    } as ApiResponse<UserResponse>);

  } catch (error) {
    console.error("Update user error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          statusCode: 400,
          details: error.errors
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        statusCode: 500
      }
    });
  }
};

export const deleteUserRoute: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await UserModel.deleteOne({ username });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found",
          statusCode: 404
        }
      });
    }

    res.json({
      success: true,
      data: { message: "User deleted successfully" }
    });

  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        statusCode: 500
      }
    });
  }
};