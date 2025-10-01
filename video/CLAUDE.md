# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BOATY (Boat Organizer & Automated Transfer to YouTube) is a Flask-based web application for managing boat video workflows from source capture through YouTube publication. The application handles video renaming with standardized naming conventions and automated YouTube uploads with playlist management.

## Commands

### Development
```bash
# Activate virtual environment
source boaty_venv/bin/activate  # macOS/Linux
# or: boaty_venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server (default: http://localhost:5000)
python app.py
```

### Testing
```bash
# Run rename preview tests
python test_rename_preview.py

# Run Playwright browser tests
python test_rename_preview_playwright.py

# Run validation tests
python test_validation_improvements.py
```

## Architecture

### Core Components

**Flask Application (`app.py`)**
- Main entry point with route handlers for all API endpoints
- Manages upload queue and status tracking with global state (`upload_status`, `upload_queue`)
- Background thread processing for YouTube uploads via `process_upload_queue()`
- OAuth callback handling for YouTube authentication at `/api/youtube-auth-callback`

**File Operations (`utils/file_operations.py`)**
- `FileOperations` class handles all video file management
- Maintains `rename_log` for undo functionality
- Sanitizes filenames to remove invalid characters
- Groups upload-ready videos by boat name using date patterns (MM-DD-YYYY)
- Temporary backup system in `archive/deleted_temp/` for deleted video recovery

**YouTube API (`utils/youtube_api.py`)**
- `YouTubeAPI` class wraps Google YouTube Data API v3
- Token-based authentication stored in `token.json`
- Resumable upload with chunked transfer (256KB or 1MB chunks)
- Optional upload throttling based on `config.json` settings
- Retry logic with exponential backoff for network failures
- Progress callbacks and pause/resume support during uploads

**Logging (`utils/logging.py`)**
- `OperationLogger` tracks rename, upload, playlist, and archive operations
- Timestamped logs stored in `logs/` directory with format `boaty_YYYYMMDD_HHMMSS.log`

### Video Workflow States

1. **Source** (`directories.source`): Raw videos awaiting rename
2. **Upload** (`directories.upload`): Renamed videos ready for YouTube
3. **Archive** (`directories.archive`): Uploaded videos organized by month (`YYYY-MM/`)

Videos are never in multiple directories simultaneously - they move sequentially through the workflow.

### Naming Conventions

Videos follow the pattern: `{boat_name} {MM-DD-YYYY} {position} ({type}){extension}`

Types:
- 1 video/boat: No suffix
- 2 videos/boat: "(Before)" and "(After)"
- 3+ videos/boat: "(Before)", custom suffixes, "(After)"

### Configuration

`config.json` structure:
```json
{
  "directories": { "source", "upload", "archive" },
  "youtube": { "default_privacy", "auto_create_playlists" },
  "video": { "min_size_mb", "max_size_mb" },
  "upload": { "throttling_enabled", "max_upload_rate_mbps" }
}
```

YouTube credentials in `client_secrets.json` (OAuth 2.0 Desktop Client).

### Frontend

Single-page application (`templates/index.html`) with:
- Drag & drop video upload interface
- Three-step workflow tabs (Source, Rename, Upload)
- Real-time upload progress with speed/ETA tracking
- Settings modal for directories, YouTube, and video preferences

JavaScript modules (`static/js/`):
- `main.js`: Core UI logic and API communication
- `rename-preview.js`: Interactive rename preview with drag/drop reordering

## Key Implementation Details

### Upload Status Tracking

Global `upload_status` dictionary tracks:
- `active`, `complete`, `paused`: Overall state
- `completed`, `failed`, `in_progress`: Counters
- `current_upload`: Active video with progress/speed/ETA
- `completed_uploads`, `failed_uploads`, `pending_uploads`: Video ID arrays
- `recent_uploads`: Array of upload results for UI display

### Rename Log & Undo

`FileOperations.rename_log` stores operations as:
```python
{
  "source": original_path,
  "destination": renamed_path,
  "original_exists": bool
}
```

Undo restores source files from upload directory and removes renamed copies.

### YouTube Upload Flow

1. Authenticate via OAuth (browser redirect to `/api/youtube-auth-callback`)
2. Find/create playlists matching boat names (fuzzy matching: exact → prefix → contains)
3. Sort videos: Before → Other → After
4. Upload with resumable transfer and optional rate throttling
5. Add to playlist (if matched/created)
6. Archive to `{archive}/{YYYY-MM}/{filename}`
7. Delete source file (if exists)

### Retry & Error Handling

- YouTube API calls: 3 retries with exponential backoff (5s → 10s → 20s)
- Chunk uploads: 3 retries per chunk with exponential backoff
- Network errors: `HttpError`, `TimeoutError`, `ConnectionResetError`, `SSLError`

### Throttling Algorithm

When `upload.throttling_enabled = true`:
- Calculate current rate after each chunk: `(bytes * 8) / (elapsed * 1000000)` Mbps
- If rate exceeds `max_upload_rate_mbps`, delay next chunk to target rate
- Interval resets after each chunk for responsive rate control

## Development Notes

- Always activate the virtual environment before running or installing packages
- `config.json` paths must exist - app creates directories on startup
- YouTube API requires valid `client_secrets.json` from Google Developer Console
- First YouTube upload triggers OAuth flow in browser
- Upload process runs in background thread with Flask app context
- Front-end polls `/api/upload-status` during active uploads
- Cache busting via `CACHE_VERSION = str(int(time.time()))` for static assets

## Mobile Project

**Status**: Planning Phase Complete
**Documentation**: `docs/mobile/`

BOATY Mobile is a standalone React Native app for field-independent boat video workflow with GoPro WiFi integration and cellular YouTube uploads.

### Quick Start for Mobile Work
```bash
# Read mobile docs
cat docs/mobile/PROGRESS.md          # Current status
cat docs/mobile/MOBILE_ROADMAP.md    # Full development plan
cat docs/mobile/MOBILE_SETUP.md      # Environment setup
cat docs/mobile/GOPRO_INTEGRATION.md # GoPro WiFi API
```

### Key Features
- **GoPro Integration**: Direct WiFi download from camera
- **Cellular Uploads**: Upload videos over 4G/5G
- **Background Processing**: Continue when phone locked
- **Offline-First**: Queue operations for later sync
- **Field Independent**: No computer required

### Current Phase
**Planning** - Documentation complete, ready for Phase 1 (Core Setup)

See `docs/mobile/PROGRESS.md` for detailed status and next steps.

---

## Development Workflow

**IMPORTANT**: Always follow these steps after making code changes:

1. **Test with Playwright**: Run `python test_rename_preview_playwright.py` to verify UI functionality
2. **Push to GitHub**: After testing passes, commit and push all changes to the repository

This ensures all changes are tested and version controlled.
- after each chagne, test in playwright then push to github