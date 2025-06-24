# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Lost & Found application built with a microservices architecture:
- **Backend**: Node.js/Express API server with PostgreSQL database
- **Frontend**: Vue 3 SPA with Vite and Tailwind CSS
- **ML Service**: FastAPI service with OCR capabilities (PaddleOCR, Tesseract, CLIP, BLIP models)
- **Infrastructure**: Docker Compose with Nginx reverse proxy

## Development Commands

### Starting the Application
```bash
# Start all services via Docker Compose
docker compose up --build -d

# Or use the convenience script
./start_lostfound.sh
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development  
```bash
cd backend
npm run dev          # Start backend server (Node.js)
```

### ML Service
The ML service runs as a FastAPI application in Docker with GPU support for OCR processing.

## Architecture Details

### Backend Structure (`backend/`)
- **Entry Point**: `src/index.js` - Express server with route registration
- **Database**: PostgreSQL with pgvector extension, connection via `src/db.js`
- **Routes**: Modular route files in `src/routes/`:
  - `admin_routes.js` - Organization/user management (requires JWT auth)
  - `claims.js` - Item claiming functionality
  - `item_and_template_routes.js` - Item management and templates
  - `payment_routes.js` - Stripe payment integration
  - `stripe_webhook.js` - Stripe webhook handling
  - `activity_routes.js` - Activity tracking
- **Authentication**: JWT-based with `authenticateToken` middleware
- **File Uploads**: Multer for handling item images in `uploads/` directory

### Frontend Structure (`frontend/`)
- **Framework**: Vue 3 with Vue Router
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Key Components**:
  - Layout components: `GuestLayout.vue`, `MainLayout.vue`
  - Navigation: `DesktopHeader.vue`, `MobileHeader.vue`, `DesktopSidebar.vue`
  - Admin: `TagAdmin.vue`, `OrganizationManagement.vue`, `UserManagement.vue`
- **Authentication**: JWT token stored in localStorage, automatically attached to axios requests

### Database Setup
- PostgreSQL with pgvector extension (for vector similarity search)
- Initialize with: `backend/db/init.sql`
- Docker container name: `lostfound-pg`

### ML Service (`ml_service/`)
- **OCR Processing**: Smart OCR pipeline with zone detection
- **Models**: CLIP, BLIP for image understanding and description generation
- **GPU Support**: Configured for NVIDIA GPU acceleration via Docker runtime

## Environment Configuration

Key environment variables (see `.env`):
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `EMAIL_SERVICE_API_KEY` - Email notifications
- `SHIPPING_API_KEY` - Shipping integration
- Database credentials for PostgreSQL connection

## Service Ports

- Frontend: `4173` (internal), `5173` (external via Nginx)
- Backend API: `3000`
- ML Service: `8001` (mapped to internal `80`)
- Database: `5432` (internal)
- Nginx: `443` (HTTPS)

## Testing

No specific test commands are configured in package.json files. Tests should be added as needed for the project.

## Deployment Notes

- Uses Nginx reverse proxy with SSL termination
- Docker Compose orchestrates all services
- ML service requires NVIDIA runtime for GPU acceleration
- SSL certificates expected in `nginx/certs/`
- See `POST_REPLICATION_SETUP.md` for detailed deployment instructions