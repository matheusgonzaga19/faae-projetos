# FAAE Projetos - Task Management System

## Overview

FAAE Projetos is a comprehensive task management platform specifically designed for architectural project management. The system provides a full-stack solution with real-time collaboration features, AI-powered task search, and intuitive project tracking capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom styling
- **Charts**: Chart.js with react-chartjs-2 for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session store
- **Real-time Communication**: WebSocket for live updates
- **File Handling**: Multer for file uploads with local storage

### Database Schema
- **Users**: Profile management with role-based access control
- **Projects**: Project lifecycle management with client information
- **Tasks**: Comprehensive task tracking with status, priority, and time tracking
- **Files**: File attachment system with metadata storage
- **Notifications**: Real-time notification system
- **Comments**: Task collaboration features

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Session Management**: Secure session handling with PostgreSQL storage
- **Role-based Access**: Admin and collaborator roles with different permissions
- **Security**: HTTPS-only cookies with proper session timeout

### Task Management
- **Kanban Board**: Drag-and-drop task organization
- **Calendar View**: Timeline-based task visualization with heatmap
- **Status Tracking**: Multi-stage workflow (aberta, em_andamento, concluida, cancelada)
- **Priority Management**: Four-level priority system (baixa, media, alta, critica)
- **Time Tracking**: Estimated vs actual hours with efficiency calculations

### AI Integration
- **Search Engine**: OpenAI-powered intelligent task search
- **Natural Language Processing**: Query understanding for task retrieval
- **Context-aware Responses**: AI assistant specialized in architectural project management

### File Management
- **Upload System**: Multi-format file support with 500MB limit
- **Preview Support**: Image and PDF preview capabilities
- **Organization**: Project and task-based file categorization
- **Security**: Authenticated file access with proper permissions

### Real-time Features
- **WebSocket Integration**: Live updates for task changes
- **Notification System**: Real-time alerts for important events
- **Collaborative Editing**: Multi-user task updates with conflict resolution

## Data Flow

1. **Authentication Flow**: User authenticates via Replit Auth → Server validates session → Client receives user data
2. **Task Operations**: Client sends request → Server validates permissions → Database update → WebSocket broadcast → UI update
3. **File Upload**: Client uploads file → Server processes with Multer → Database metadata storage → File system storage
4. **AI Search**: User query → Server forwards to OpenAI → Response processing → Formatted results returned

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **openai**: AI-powered search functionality
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **chart.js**: Data visualization charts
- **date-fns**: Date manipulation and formatting

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **TypeScript Compilation**: Real-time type checking
- **Database**: Automatic migration on startup
- **File Storage**: Local uploads directory

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild compilation to single file
- **Database**: Drizzle migrations with PostgreSQL
- **Static Assets**: Served via Express with proper caching

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **Authentication**: Replit Auth configuration
- **AI Services**: OpenAI API key configuration
- **Session Security**: Secure session secret

## Changelog

Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Enhanced FAAE Projetos system with:
  - FAAE branding and visual identity
  - Project management for arquitetura stands and constructions
  - Enhanced database schema with project teams, portfolios, and time tracking
  - Professional landing page with FAAE design elements
  - Comprehensive user roles (admin, project_manager, architects, budget_specialist)
  - Real-time collaboration features
  - AI-powered search and analytics
  - File management with preview capabilities
  - Task management with kanban boards and calendar views

## Recent Changes

### Firebase Auth Integration Complete (August 9, 2025)
- **User Management System**: Created AuthContext with role-based access control
- **Security Rules**: Documented Firestore security rules for assigneeId-based access
- **Task Assignment**: Added assigneeId field to tasks with user filtering in Kanban board
- **Optimized Queries**: Created useTasksOptimized hook to prevent full collection scans
- **Role System**: Implemented admin vs colaborador roles with proper permissions
- **User Filtering**: Added "Todos os usuários" and assignee-specific filters in Dashboard and Kanban
- **Performance Documentation**: Created FIREBASE_SECURITY.md with implementation guidelines

### Performance Optimization Complete (August 9, 2025)
- **Firebase Query Optimization**: Implemented efficient querying to prevent full collection scans
- **Composite Indexes**: Created documentation for required Firestore composite indexes
- **Smart Filtering**: Always require projectId, assignedUserId, or status filters for task queries
- **Result Limiting**: Added configurable limits (50-500) to prevent excessive data transfer
- **Real-time Subscriptions**: Added subscription management service with automatic cleanup
- **Memory Leak Prevention**: Implemented proper useEffect cleanup for onSnapshot subscriptions
- **Performance Monitoring**: Added warnings for unindexed queries and full collection scans
- **Calendar Optimization**: Separate query strategies for calendar (orderByDueDate) vs kanban views
- **Query Caching**: Enhanced React Query keys for better cache invalidation strategies

### Firebase Migration Complete (August 7, 2025)
- **MAJOR ARCHITECTURE CHANGE**: Complete migration from backend/SQLite to Firebase
- **Authentication**: Replaced Replit Auth with Firebase Auth + Google login
- **Database**: Migrated from PostgreSQL to Firestore for real-time data
- **File Storage**: Implemented Firebase Storage for file uploads
- **Real-time Features**: Using Firestore listeners for live updates
- **Configuration**: Created Firebase setup guide and environment templates
- **Role System Fixed**: Implemented proper admin/collaborator role management
- **User Management**: Created user role management interface for administrators
- **Error Handling**: Fixed role-related null pointer exceptions
- **Cross-platform**: Fixed Windows compatibility issues with npm scripts
- **Backwards Compatibility**: Maintained all existing features and Portuguese interface

### FAAE Projetos Enhancement (June 30, 2025)
- Created comprehensive project management platform inspired by FAAE website
- Added FAAE logo component with SVG design
- Enhanced database schema with additional tables:
  - Project teams for role-based collaboration
  - Portfolio items for showcasing completed projects
  - Enhanced user roles for architectural project management
- Created professional landing page with FAAE branding
- Integrated HeroSection component showcasing company statistics and achievements
- Added project types specific to architectural work (stands, projects, reforms, maintenance)
- Enhanced constants for architectural project workflow stages

## User Preferences

Preferred communication style: Simple, everyday language.
Project Focus: Comprehensive architectural project management system branded with FAAE identity.