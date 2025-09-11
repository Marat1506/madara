# eMadrasa - Islamic Education Management System

A modern educational management platform designed for Islamic schools and madrasas.

## 🏗️ Project Structure

The project is now separated into independent frontend and backend applications:

```
eMadrasa/
├── client/           # React frontend application
│   ├── src/         # Source code
│   ├── package.json # Frontend dependencies
│   └── vite.config.ts
├── server/          # Express backend application
│   ├── src/         # Source code
│   ├── package.json # Backend dependencies
│   └── tsconfig.json
├── shared/          # Shared TypeScript types
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- pnpm (recommended) or npm

### 1. Install Dependencies

#### Backend Setup
```bash
cd server
pnpm install
```

#### Frontend Setup
```bash
cd client
pnpm install
```

### 2. Environment Configuration

#### Backend Environment
Create `server/.env` file:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/emadrasa

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
PING_MESSAGE=eMadrasa server is running!
```

### 3. Start Development Servers

#### Start Backend (Port 5000)
```bash
cd server
pnpm dev
```

#### Start Frontend (Port 3000)
```bash
cd client
pnpm dev
```

The frontend will automatically proxy API requests to the backend.

## 🗄️ Database Setup

### MongoDB Setup

1. **Local MongoDB**: Install and start MongoDB locally
   ```bash
   # macOS with Homebrew
   brew install mongodb-community
   brew services start mongodb-community
   
   # Ubuntu
   sudo apt install mongodb
   sudo systemctl start mongodb
   ```

2. **MongoDB Atlas** (Cloud): 
   - Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create cluster and get connection string
   - Update `MONGODB_URI` in `.env`

### Database Seeding

The server automatically seeds the database with initial data on first run, including:
- Sample schools, teachers, students, and classes
- Default admin user: `UmarAdmin` / `UmarAdmMadrasa05!`
- Islamic subjects and curriculum data

## 🔧 Development

### Available Scripts

#### Backend (`server/`)
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm typecheck` - Type checking

#### Frontend (`client/`)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run tests
- `pnpm typecheck` - Type checking

### API Endpoints

Base URL: `http://localhost:5000/api`

#### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout

#### Core Resources
- `/students` - Student management
- `/teachers` - Teacher management
- `/schools` - School management
- `/classes` - Class management
- `/subjects` - Subject management
- `/enrollments` - Enrollment management
- `/schedule` - Schedule management
- `/dashboard` - Analytics and statistics

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (default frontend dev server)
- `http://localhost:5173` (alternative Vite port)

## 🏭 Production Deployment

### Backend Deployment

1. Build the application:
   ```bash
   cd server
   pnpm build
   ```

2. Set production environment variables
3. Start with process manager:
   ```bash
   pm2 start dist/index.js --name emadrasa-server
   ```

### Frontend Deployment

1. Build the application:
   ```bash
   cd client
   pnpm build
   ```

2. Serve the `dist/` folder with a web server (nginx, Apache, etc.)

3. Update API base URL in production to point to your backend server

## 🔐 Authentication

The system uses JWT-based authentication with the following default user:

- **Username**: `UmarAdmin`
- **Password**: `UmarAdmMadrasa05!`
- **Role**: Admin (full system access)

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Radix UI** - Component primitives

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Zod** - Validation
- **bcryptjs** - Password hashing

## 📊 Features

- 🏫 **School Management** - Multi-school support
- 👨‍🏫 **Teacher Management** - Qualifications and assignments
- 👨‍🎓 **Student Management** - Enrollment and profiles
- 📚 **Subject Management** - Islamic curriculum focus
- 📅 **Class Scheduling** - Timetable management
- 📈 **Analytics Dashboard** - Statistics and insights
- 🔐 **Role-based Access** - Admin and teacher roles
- 🌍 **Multi-language** - Russian and Arabic support
- 📱 **Responsive Design** - Mobile-friendly interface

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **CORS Issues**
   - Verify frontend and backend ports
   - Check CORS configuration in server
   - Ensure API proxy is configured in Vite

3. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token storage in frontend
   - Ensure admin user exists in database

### Reset Database
```bash
cd server
# The database will auto-seed on restart if empty
# Or manually reset via MongoDB tools
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

For questions or support, please open an issue on GitHub.