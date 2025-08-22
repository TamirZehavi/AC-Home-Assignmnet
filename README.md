# AC Home Assignment

A full-stack application with Angular frontend and NestJS backend.

## Project Structure

```
.
├── frontend/          # Angular application
├── backend/           # NestJS API
└── package.json       # Root package.json with global dependencies
```

## Prerequisites

- Node.js (version 18 or higher)
- npm

## Quick Start

### 1. Install Global Dependencies

From the root directory:

```bash
npm install
```

This installs Angular CLI and NestJS CLI globally.

### 2. Setup Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Start the backend server:

```bash
# Development mode with auto-reload
npm run start:dev

# Or standard development mode
npm run start

# Production mode
npm run start:prod
```

The backend will run on `http://localhost:3000` by default.

### 3. Setup Frontend

In a new terminal, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm start
```

The frontend will run on `http://localhost:4200` by default.

## Available Scripts

### Backend (NestJS)

```bash
cd backend

# Development
npm run start:dev      # Start with watch mode
npm run start:debug    # Start with debug mode

# Building
npm run build          # Build the application

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Run tests with coverage

# Linting
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Frontend (Angular)

```bash
cd frontend

# Development
npm start              # Start development server
npm run watch          # Build with watch mode

# Building
npm run build          # Build for production

# Testing
npm run test           # Run unit tests with Karma

# Server-Side Rendering
npm run serve:ssr:frontend  # Serve SSR build
```

## Development Workflow

1. Start the backend server: `cd backend && npm run start:dev`
2. Start the frontend server: `cd frontend && npm start`
3. Open your browser to `http://localhost:4200`

The backend API will be available at `http://localhost:3000`.

## Production Build

### Backend

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist/` directory.

## Technologies Used

- **Frontend**: Angular 19, TypeScript, SCSS, Angular SSR
- **Backend**: NestJS, TypeScript, Express
- **Development**: ESLint, Prettier, Jasmine, Karma, Jest

## API Endpoints

- `GET /` - Returns "Hello World!" message

## Environment Variables

### Backend

You can set the following environment variables:

- `PORT` - Server port (default: 3000)

### Frontend

- Server-side rendering is configured by default
- Port configuration can be modified in angular.json

## Troubleshooting

### Port Conflicts

If you encounter port conflicts:

- Backend: Set `PORT` environment variable or modify main.ts in backend/src/
- Frontend: Use `ng serve --port <port-number>`

### Module Installation Issues

If you encounter dependency issues:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Technologies Used

- **Frontend**: Angular 19, Angular Material, TypeScript, SCSS, Angular SSR
- **Backend**: NestJS, TypeScript, Express, Multer (file uploads)
- **Development**: ESLint, Prettier, Jasmine, Karma, Jest

## Features

- **File Upload System**: CSV file upload with validation and size limits (up to 1000MB)
- **Server-Side Rendering**: Angular SSR for improved performance
- **Material Design**: Angular Material components for UI
- **Health Monitoring**: Backend health check endpoints

## API Endpoints

- `GET /` - Returns "Hello World!" message
- `GET /health` - Health check endpoint
- `POST /upload` - File upload endpoint (CSV files, max 1000MB)
- `GET /upload/status` - Upload service status

## File Upload

The application supports CSV file uploads with the following specifications:

- **Maximum file size**: 1000MB
- **Supported formats**: CSV files only
- **Upload endpoint**: `POST /upload`
- **Storage**: Files are stored in the `backend/uploads/` directory