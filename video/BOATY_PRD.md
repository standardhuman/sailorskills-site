# BOATY - Product Requirements Document

**Product Name:** BOATY (Boat Organizer & Automated Transfer to YouTube)  
**Version:** 1.2.0  
**Last Updated:** April 17, 2025

## 1. Introduction

BOATY (Boat Organizer & Automated Transfer to YouTube) is a specialized application designed to streamline the workflow for marine service professionals who need to document boat inspections and repairs through video footage. The application provides an end-to-end solution for organizing, renaming, and uploading boat inspection videos to YouTube in a structured and efficient manner.

## 2. Product Overview

BOATY is a Flask-based web application that helps marine service providers manage their video documentation workflow. The application allows users to:

- Organize source videos by boat name and date
- Automate the renaming of video files based on boat information
- Prepare videos for upload with appropriate metadata
- Upload videos to YouTube with customizable privacy settings
- Organize videos into boat-specific playlists
- Control upload speeds to manage network bandwidth

The application solves the problem of manually managing large numbers of boat inspection videos and provides a streamlined, automated solution for documentation and client sharing.

## 3. Target Audience

The primary users of BOATY are:

- Marine service professionals
- Boat inspection companies
- Boat repair and maintenance services
- Marine surveyors
- Yacht management companies

These users typically need to document boat conditions before and after service, share videos with clients, and maintain organized records of their work.

## 4. User Journeys

### 4.1 Initial Setup

1. User launches the BOATY application
2. User configures directory settings for source, upload, and archive folders
3. User configures YouTube settings (privacy, playlist creation)
4. User configures video size settings for filtering

### 4.2 Video Organization Workflow

1. User adds source videos to the application through the drag-and-drop interface
2. User filters videos based on size if needed
3. User enters boat names and selects the date of inspection
4. User specifies the number of videos per boat and adds custom labels if needed
5. User initiates the rename process
6. The application automatically renames and organizes the videos

### 4.3 YouTube Upload Workflow

1. User reviews the renamed and organized videos
2. User initiates the upload preview to see a summary of what will be uploaded
3. User confirms the upload
4. The application uploads videos to YouTube, creating playlists as needed
5. User monitors upload progress and receives confirmation when complete

## 5. Functional Requirements

### 5.1 Video Management

- **FR1.1:** The system shall provide a drag-and-drop interface for adding source videos
- **FR1.2:** The system shall support filtering videos by size
- **FR1.3:** The system shall allow users to delete source videos with undo capability
- **FR1.4:** The system shall support video preview functionality
- **FR1.5:** The system shall track recently deleted videos and allow restoration

### 5.2 Video Organization

- **FR2.1:** The system shall provide a form for entering boat names (multiple)
- **FR2.2:** The system shall allow selection of inspection date
- **FR2.3:** The system shall support specifying the number of videos per boat
- **FR2.4:** The system shall support custom suffix labels for videos
- **FR2.5:** The system shall support common video purpose templates (e.g., "Propeller Removal")
- **FR2.6:** The system shall automatically rename videos based on user input
- **FR2.7:** The system shall support undo functionality for rename operations

### 5.3 YouTube Integration

- **FR3.1:** The system shall authenticate with the YouTube API
- **FR3.2:** The system shall upload videos to YouTube with correct metadata
- **FR3.3:** The system shall support configurable privacy settings (private, unlisted, public)
- **FR3.4:** The system shall automatically create playlists if a matching playlist is not found.
- **FR3.5:** The system shall intellignetly find appropriate playlists and add videos
- **FR3.6:** The system shall support upload rate throttling
- **FR3.7:** The system shall provide real-time upload progress and status

### 5.4 File Management

- **FR4.1:** The system shall manage source, upload, and archive directories
- **FR4.2:** The system shall move successfully uploaded videos to the archive
- **FR4.3:** The system shall organize archived videos by month

### 5.5 Configuration

- **FR5.1:** The system shall allow configuration of directory paths
- **FR5.2:** The system shall allow configuration of YouTube settings
- **FR5.3:** The system shall allow configuration of video size thresholds
- **FR5.4:** The system shall allow configuration of upload throttling settings

## 6. Non-Functional Requirements

### 6.1 Performance

- **NFR1.1:** The system shall support concurrent uploads to YouTube
- **NFR1.2:** The system shall provide responsive feedback during long-running operations

### 6.2 Usability

- **NFR2.1:** The system shall provide a step-by-step workflow interface
- **NFR2.2:** The system shall provide clear visual indicators for video status
- **NFR2.3:** The system shall include help text and tooltips for key functions
- **NFR2.4:** The system shall provide visual feedback for upload progress
- **NFR2.5:** The system shall support collapsible sections for better workspace management

### 6.3 Reliability

- **NFR3.1:** The system shall recover gracefully from upload failures
- **NFR3.2:** The system shall track upload status for recovery
- **NFR3.3:** The system shall provide undo capabilities for critical operations
- **NFR3.4:** The system shall validate input data before processing

### 6.4 Security

- **NFR4.1:** The system shall securely store YouTube API credentials
- **NFR4.2:** The system shall validate file paths to prevent directory traversal
- **NFR4.3:** The system shall restrict video serving to authorized paths

## 7. UI/UX Design

### 7.1 Layout

- **UI1.1:** The system shall provide a navbar with access to settings
- **UI1.2:** The system shall organize the workflow into sequential steps
- **UI1.3:** Each step shall have a collapsible card interface
- **UI1.4:** The system shall include a footer with version information

### 7.2 Video Management Interface

- **UI2.1:** Videos shall be displayed in a grid layout with thumbnails
- **UI2.2:** Video cards shall include metadata (size, creation date)
- **UI2.3:** Video cards shall include action buttons (delete, preview)
- **UI2.4:** Size-filtered videos shall have visual indicators

### 7.3 Settings Interface

- **UI3.1:** Settings shall be organized into logical sections
- **UI3.2:** Directory settings shall include path inputs
- **UI3.3:** YouTube settings shall include privacy options
- **UI3.4:** Video settings shall include size thresholds
- **UI3.5:** Upload settings shall include throttling options

### 7.4 Upload Interface

- **UI4.1:** Upload preview shall display a summary of videos to be uploaded
- **UI4.2:** Upload status shall include progress bars and percentage indicators
- **UI4.3:** Upload cards shall change appearance based on status (pending, uploading, complete, failed)

## 8. Key Features

### 8.1 Video Organization and Renaming

- Bulk rename videos based on boat names and date
- Support for Before/After designation
- Custom suffixes for additional video types
- Common templates for video purposes
- Undo capability for rename operations

### 8.2 YouTube Integration

- Direct upload to YouTube
- Automatic playlist creation and management
- Configurable privacy settings
- Upload preview with dry run capability
- Real-time upload progress tracking

### 8.3 File Management

- Organized directory structure (source, upload, archive)
- Automatic archiving of uploaded videos
- Monthly organization of archived videos
- Deleted video recovery

### 8.4 Upload Throttling

- Enable/disable upload rate limiting
- Configurable maximum upload speed
- Real-time transfer rate monitoring
- Network-friendly uploading

## 9. Technical Architecture

### 9.1 Frontend

- HTML5, CSS3, JavaScript
- Bootstrap 4.6 for responsive design
- jQuery for DOM manipulation
- Custom JavaScript for interactive features

### 9.2 Backend

- Flask web framework
- Python 3.x
- YouTube Data API v3
- RESTful API endpoints

### 9.3 Key Components

- **FileOperations:** Manages file system operations
- **YouTubeAPI:** Handles YouTube API interactions
- **Flask Routes:** Provides API endpoints and rendering
- **Upload Queue:** Manages upload sequence and status

## 10. Future Enhancements

### 10.1 Authentication

- User login and authentication
- Role-based access control
- Multiple user support

### 10.2 Enhanced Metadata

- Custom video descriptions
- Tags management
- Thumbnail customization

### 10.3 Additional Integrations

- Vimeo upload support
- Dropbox/Google Drive integration
- Client notification system

### 10.4 Advanced Features

- Automatic video trimming
- Basic video editing capabilities
- Batch processing improvements
- Scheduled uploads

---

## Appendix A: Glossary

- **Source Videos:** Raw, unprocessed videos requiring organization
- **Upload-Ready Videos:** Renamed and organized videos ready for YouTube upload
- **Archive:** Storage location for successfully uploaded videos
- **Before/After:** Designation for videos showing pre-service and post-service conditions
- **Boat Name:** The identifier used to group related videos
- **Playlist:** YouTube playlist automatically created for each boat
- **Upload Throttling:** Feature to limit upload speeds to preserve network bandwidth
