# MelodyStream Music Application

## Overview

MelodyStream is a modern music streaming application built with a full-stack TypeScript architecture. The application allows users to search for music tracks using the iTunes API, play audio previews, and maintains search history. It features a sleek, dark-themed UI with gradient accents and comprehensive audio controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**January 27, 2025:**
- **DJ Party Modes System**: Created 6 predefined DJ modes for specific party vibes:
  - **Daaru Party**: High-energy Punjabi drinking celebration songs with party anthems
  - **Wedding Party**: Mixed celebratory songs perfect for Indian wedding festivities  
  - **Punjabi Vibes**: Pure Punjabi music collection with authentic regional sounds
  - **Tamil Vibe**: South Indian Tamil music with Kollywood charm and melody
  - **Bollywood Party**: High-energy Hindi film songs for ultimate dance parties
  - **EDM Party**: Electronic dance music for club-style energy and beats
- **Smart Mode Selection UI**: Interactive modal with mode cards showing icons, descriptions, languages, genres, and energy levels
- **Mode-Specific Queue Building**: Each mode has curated search queries and filtering criteria for authentic music selection
- **Language-First Scoring**: Modes prioritize language consistency (70% weight) over genre matching for authentic regional experiences
- **Enhanced DJ Controller**: Added startDJModeWithMode(), setDJMode(), filterTracksByMode() methods for mode management
- **Visual Mode Integration**: DJ button shows current active mode name and provides easy mode switching interface

**Previous Updates:**
- Built professional DJ transition engine with crossfading capabilities
- Implemented dual-audio system for seamless track mixing with smooth 3-second crossfades
- Added smart transition timing that starts crossfade before current track ends
- Created comprehensive language detection system supporting 17+ languages including:
  - Major Indian regional languages: Punjabi, Marathi, Tamil, Telugu, Gujarati, Bengali, Rajasthani, Kannada, Malayalam
  - International languages: English, Hindi, Spanish, Korean, Japanese, French, Arabic, Portuguese
- Enhanced vibe analyzer with language priority and improved genre matching
- Updated DJ controller to prioritize same-language tracks for consistent listening experience
- Added transition controls allowing users to adjust crossfade duration (1s/3s/5s)
- Implemented language-aware search queries for better track discovery
- Enhanced compatibility scoring with language as highest priority factor (30% boost for same language)
- Added visual transition indicators and crossfading status in player UI
- Comprehensive Indian regional language support with authentic artist names, song patterns, and cultural keywords
- **Film Industry Priority System**: Added film industry detection as top criteria for next song selection
  - Recognizes 10 major film industries: Bollywood, Hollywood, Tollywood, Kollywood, Mollywood, Sandalwood, Punjabi Cinema, Bhojpuri, Marathi Cinema, International
  - 40% boost for same film industry, 20% boost for compatible industries (e.g., South Indian cinemas)
  - Maintains film industry consistency for authentic movie music experience
  - Compatible industry groupings: Bollywood family (Hindi), South Indian family (Telugu/Tamil/Malayalam/Kannada), Western (Hollywood/International)
- **Language-Priority Smart Queue**: Complete rebuild with language detection as absolute highest priority:
  - **Language Detection (60% weight)**: Advanced pattern matching using track names, artist names, and script detection
  - **Genre Matching (25% weight)**: iTunes API primaryGenreName with similar genre fallbacks
  - **Country Matching (10% weight)**: Regional compatibility for cultural consistency  
  - **Duration Matching (5% weight)**: Tracks within ±10% of reference track duration for flow
  - **Comprehensive Language Support**: Punjabi, Hindi, Tamil, Telugu, Korean, Japanese, English with authentic artist/keyword patterns
  - **Language-Specific Search**: Targeted queries like "punjabi songs", "bollywood music", "kpop" based on detected language
  - **Anti-Mixing Protection**: Heavy penalties for language mismatches to prevent English songs after Punjabi
  - **Fixed Crossfading Volume Issue**: Volume changes no longer trigger unwanted track transitions

**January 26, 2025:**
- Fixed search functionality with proper URL encoding and query handling
- Resolved TypeScript errors in backend storage system
- Completely rebuilt audio player with simplified, reliable architecture
- Fixed progress bar functionality with proper timeupdate event handling
- Implemented automatic playback when songs are selected from cards
- Added replay functionality for 30-second previews
- Enhanced error handling and loading states for audio playback
- Added visual indicators for tracks without available previews
- Improved user experience with clear preview limitations messaging
- Enhanced artwork quality by upgrading iTunes API images from 100x100 to 600x600 pixels
- Updated fallback artwork URLs to use higher resolution placeholders
- Implemented robust URL pattern matching for different iTunes artwork formats
- Redesigned song cards with full-size poster display using square aspect ratio
- Added hover overlay effects with centered play button for better user interaction
- Optimized grid layout for improved poster visibility and responsive design

**Final Working State:**
- Search: Fully functional with iTunes API integration
- Audio Player: Complete with auto-play, progress tracking, volume control
- UI: Dark theme with purple/pink gradients, responsive design
- Preview System: 30-second iTunes clips with proper user expectations

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with proper error handling
- **Development**: Hot module replacement via Vite integration

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Migration System**: Drizzle Kit for schema migrations
- **Storage Strategy**: Hybrid approach with in-memory storage for development and PostgreSQL for production

## Key Components

### Frontend Components
1. **Audio Player**: Full-featured music player with play/pause, volume control, and progress tracking
2. **Search Interface**: iTunes API integration with real-time search capabilities
3. **Music Library**: Grid-based track display with artwork and metadata
4. **UI Components**: Comprehensive shadcn/ui component library including buttons, inputs, cards, and modals

### Backend Services
1. **iTunes API Proxy**: CORS-enabled proxy for iTunes search API
2. **Search History**: User search tracking and persistence
3. **Error Handling**: Centralized error management with proper HTTP status codes
4. **Logging**: Request/response logging for API endpoints

### Data Models
- **Users**: Basic user authentication schema
- **Search History**: Track user searches with timestamps
- **iTunes Integration**: Validated track data from external API

## Data Flow

1. **Search Flow**: User input → Frontend validation → Backend proxy → iTunes API → Response validation → UI update
2. **Audio Playback**: Track selection → Audio element management → State updates → UI controls
3. **Search History**: Search execution → Backend persistence → Database storage
4. **Error Handling**: API errors → Backend validation → Frontend error states → User feedback

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **express**: Backend web server framework
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Frontend build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with Express integration
- **Database**: In-memory storage for rapid development
- **Error Overlay**: Runtime error modal for debugging
- **Replit Integration**: Custom plugins for Replit environment

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: ESBuild compilation to single JavaScript file
- **Database**: PostgreSQL with environment-based configuration
- **Static Assets**: Served via Express with proper caching headers

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required for production)
- **NODE_ENV**: Environment detection for development/production modes
- **Build Outputs**: Separate client and server build processes

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared TypeScript types between client and server
2. **Type Safety**: End-to-end TypeScript with Zod validation for API boundaries
3. **Component Architecture**: Modular component design with clear separation of concerns
4. **API Proxy Pattern**: Backend proxy to avoid CORS issues with external APIs
5. **Responsive Design**: Mobile-first approach with Tailwind responsive utilities
6. **Error Boundaries**: Comprehensive error handling at both frontend and backend levels