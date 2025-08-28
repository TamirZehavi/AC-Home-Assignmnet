# AC Home Assignment

A full-stack application with Angular frontend and NestJS backend for handling file uploads

## Project Structure

```
.
├── frontend/          # Angular application
├── backend/           # NestJS API
├── shared/            # Shared TS types to be used by front and back
└── package.json       # Root package.json with global dependencies
```

## Prerequisites

- Node.js - version 22.5.1
- npm - version 10.8.2

## Quick Start

### 1. Install Global Dependencies

From the root directory:

```bash
npm run install:all
```

This installs Angular CLI and NestJS CLI for this folder, as well as all dependencies of frontend, backend and shared.

### 2. Build

Navigate to the backend directory and install dependencies:

```bash
npm run build:all
```

### 3. Start the backend server:

From the root directory:

```bash
npm run start
```

The backend will run on `http://localhost:8567` by default

## Environment Variables

You can set environment variables in the `.env` file in the `backend` folder, such as `PORT`, `SECRET_KEY`, `DATABASE_NAME` and more. 