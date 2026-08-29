# AI-Powered Image Processing Attendance Management System

This document outlines the implementation plan for the automated attendance management system using facial recognition. The system will automate classroom attendance using group image capture, reducing manual work and proxy attendance while providing detailed real-time analytics for Admins, Teachers, and Students.

## User Review Required

Before we begin implementation, please review the following technical decisions:

> [!IMPORTANT]
> **Database Selection:** The requirements mentioned PostgreSQL or MongoDB. Given the highly relational nature of this data (Students belong to Sections, Sections map to Timetables, Timetables have Subjects and Teachers, Attendance records map to all of these), **I strongly recommend PostgreSQL**. Please confirm if PostgreSQL is acceptable.

> [!IMPORTANT]
> **Frontend Framework:** The requirements mention React.js or Next.js. I propose using **Next.js (App Router)**. It provides excellent routing, performance optimizations, and a great developer experience out of the box. Please confirm.

> [!IMPORTANT]
> **Authentication:** We will use JWT with HTTP-only cookies for secure session management on the web frontend.

## Open Questions

> [!NOTE]
> 1. **Testing Face Recognition Locally:** Do you have a webcam available on your current machine for testing the registration and live attendance capture flows during development? Or will you be uploading existing test images?
> 2. **Cloudinary Setup:** We will need Cloudinary API keys to store the classroom and student registration images. Do you have an account ready, or should we use local storage for the initial development phase?
> 3. **Email Alerts:** For the low attendance alert system, we can use Nodemailer with a test SMTP server (like Mailtrap) for development. Does that sound good?

## Proposed Architecture

We will adopt a modular, microservices-oriented architecture:

1.  **Frontend Client (`/frontend`)**: Next.js + Tailwind CSS + Framer Motion + Redux Toolkit. This will handle the Admin Dashboard, Teacher Portal, and Student Dashboard.
2.  **Primary Backend API (`/backend`)**: Node.js + Express + Prisma (ORM for PostgreSQL). This will handle user authentication, CRUD operations for departments/users/timetables, JWT management, and report generation.
3.  **AI Face Recognition Microservice (`/ai-service`)**: Python + FastAPI + InsightFace + RetinaFace. This service will exclusively handle image processing: receiving images, detecting faces, generating embeddings, and comparing embeddings to return matching student IDs.

## Implementation Phases

To ensure a structured and successful build, we will divide the project into logical phases:

### Phase 1: Foundation & Infrastructure (Backend + DB)
- Setup Monorepo structure (`frontend`, `backend`, `ai-service`).
- Initialize PostgreSQL database and define the Prisma schema (Admins, Teachers, Students, Departments, Subjects, Sections, Timetables, Attendance).
- Setup Node.js Express backend with basic error handling, CORS, and logging.
- Implement Authentication service (JWT login/registration flows, Role-based middleware).

### Phase 2: AI Face Recognition Microservice
- Setup Python FastAPI environment.
- Integrate RetinaFace for multi-face detection in group photos.
- Integrate InsightFace for feature extraction and embedding generation.
- Create endpoints for:
  - `/register-face` (extracts embedding from a clear single-person photo).
  - `/process-attendance` (takes a classroom photo, detects all faces, matches against registered embeddings, and returns recognized IDs).

### Phase 3: Core Application Logic (Backend APIs)
- Implement Admin CRUD APIs (manage departments, approve teachers, manage sections/timetables).
- Implement Teacher APIs (create/view timetables, upload attendance images, manual override).
- Implement Student APIs (view attendance, face registration).
- Implement QR Code generation and validation logic for student registration to a class.

### Phase 4: Modern Frontend Development (Next.js)
- Setup Tailwind CSS, dark/light mode themes, and global UI components (Glassmorphism, animations).
- Build Auth Pages (Login, Registration).
- Build Admin Dashboard (Charts, Tables, Approvals).
- Build Teacher Portal (Timetable view, QR generator, Camera UI for capturing classroom, manual attendance editor).
- Build Student Dashboard (Attendance stats, alerts, Face enrollment UI).

### Phase 5: Integration, Notifications & Reporting
- Connect Frontend with Backend and AI Microservice.
- Implement Email Alerts for low attendance (< 75%).
- Implement PDF/Excel report generation on the backend.
- End-to-end testing of the complete attendance workflow.

## Verification Plan

### Automated Tests
- Postman/Jest for testing backend API endpoints (Auth, CRUD).
- Unit tests for the AI microservice to verify face matching accuracy against a test dataset.

### Manual Verification
- Run the full stack locally (`npm run dev` for frontend/backend, `uvicorn` for Python API).
- Register a test teacher and student.
- Perform a live "Classroom Session" using test photos or webcam.
- Verify that the AI service correctly identifies the faces and the backend successfully marks the attendance in the database.
- Verify real-time updates on the Teacher and Student dashboards.
- Generate and download an Excel attendance report.
