# HNDY

Full-stack on-demand home services and contractor marketplace built with Node.js (Express 5), PostgreSQL, and React (Tailwind CSS PWA).

HNDY connects homeowners submitting repair and maintenance requests with vetted local contractors—combining AI-assisted job scoping, automated contractor dispatching, milestone Stripe payments, multi-channel notifications, and PDF work-order generation.

## Core Architecture

- **Marketplace & Workflow Engine (`backend/controllers/`, `backend/routes/`):** REST API built on Express 5 and PostgreSQL (`pg`) with Zod request validation, JWT authentication, role-based access control (Customer, Contractor, Admin), and Helmet/rate-limiting middleware.
- **AI Job Scoping (`backend/services/aiService.js`):** Uses Google Gemini (`@google/generative-ai`) to analyze customer service descriptions and uploaded photos to structure scope, trade category, and job details.
- **Automated Contractor Dispatch & Vetting (`backend/services/assignmentService.js`, `backend/controllers/contractorController.js`):** Manages contractor onboarding, credential vetting workflows, automated job assignment, and scheduled background tasks (`node-cron`).
- **Stripe Payments & Webhooks (`backend/stripe-routes.js`, `backend/stripe-webhook.js`):** End-to-end payment flows using Stripe Elements on the frontend and verified webhook handlers on the backend for customer checkouts, contractor gatekeeper fees, and payout/transaction histories.
- **Multi-Channel Notifications (`backend/services/twilioService.js`, `backend/services/notificationService.js`, `backend/utils/emailService.js`):** Real-time updates via Twilio SMS, browser Web Push notifications (`web-push` with VAPID), and transactional HTML emails (`nodemailer`).
- **Media & Document Pipeline (`backend/config/storage.js`, `backend/utils/pdfGenerator.js`):** Direct image/document uploads to Cloudinary via Multer and automated PDF invoice/work-order generation with `pdfkit`.
- **Progressive Web App Frontend (`frontend/src/`):** React 18, React Router, Tailwind CSS, and Framer Motion UI featuring offline service-worker support, push-notification opt-in, and dedicated portals for Customers, Contractors, and Admins.

## Local Setup

### 1. Backend

    cd backend
    npm install
    cp .env.example .env
    # Fill in your PostgreSQL, Stripe, Gemini, Cloudinary, Twilio, and SMTP credentials
    npm run dev

### 2. Frontend

    cd frontend
    npm install
    cp .env.example .env
    npm start
