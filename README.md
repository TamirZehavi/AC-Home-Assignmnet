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

If this fails, cd to each folder `frontend`, `backend` and `shared`, open the command line and `npm i` for each.
This installs Angular CLI and NestJS CLI for this folder, as well as all dependencies of frontend, backend and shared.

### 2. Build

Navigate to the backend directory and install dependencies:

```bash
npm run build:all
```

If this fails, cd to each folder `frontend`, `backend` and `shared`, open the command line and `npm run build` for each.

### 3. Start the backend server:

From the root directory:

```bash
npm run start
```

If this fails, cd to the `backend` folder , open the command line and `npm run start`.
The backend will run on `http://localhost:8567` by default. (you can change it in the `.env` file)
Navigate to `http://localhost:8567` and you're done.

## Environment Variables

You can set environment variables in the `.env` file in the `backend` folder, such as `PORT`, `SECRET_KEY`, `DATABASE_NAME` and more. 