# BOATY Mobile

Standalone React Native mobile app for field-independent boat video workflow with GoPro WiFi integration and cellular YouTube uploads.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

## Project Status

**Current Phase**: Phase 3 Complete ✅
**Date**: 2025-09-29

### Phase 1: Core Setup & UI (Complete ✅)
- ✅ React Native project initialized with Expo
- ✅ Navigation structure (tab + stack)
- ✅ All screen component shells created
- ✅ SQLite database configured
- ✅ Basic UI theme applied
- ✅ App structure verified

### Phase 2: GoPro Integration (Complete ✅)
- ✅ GoPro HTTP API client service
- ✅ Download manager with resume capability
- ✅ GoPro connection screen with status
- ✅ GoPro file browser with selection
- ✅ Download queue with real-time progress
- ✅ Connection status component
- ✅ Automatic queue processing

### Phase 3: Video Management (Complete ✅)
- ✅ Video library with grid view
- ✅ VideoCard component with metadata
- ✅ Search functionality (filename, boat name)
- ✅ Storage management display
- ✅ Multi-select with bulk operations
- ✅ Rename workflow with BOATY conventions
- ✅ Before/After/Custom type selection
- ✅ Live rename preview
- ✅ Delete videos with confirmation

## Structure

```
BOATY-Mobile/
├── App.js                         # Main app entry with DB init
├── src/
│   ├── screens/                   # UI screens
│   │   ├── HomeScreen.js
│   │   ├── GoProConnectScreen.js # GoPro WiFi connection
│   │   ├── GoProBrowserScreen.js # Browse GoPro media
│   │   ├── DownloadQueueScreen.js # Download progress
│   │   ├── VideoLibraryScreen.js
│   │   ├── UploadQueueScreen.js
│   │   └── SettingsScreen.js
│   ├── services/                  # Business logic
│   │   ├── VideoDatabase.js      # SQLite database
│   │   ├── GoProService.js       # GoPro HTTP API
│   │   └── DownloadManager.js    # Queue & downloads
│   ├── components/                # Reusable UI
│   │   └── ConnectionStatus.js   # GoPro status indicator
│   ├── navigation/                # Navigation setup
│   │   └── AppNavigator.js
│   └── constants/                 # App constants
│       ├── Colors.js
│       └── Config.js
```

## Technologies

- **React Native** 0.81.4
- **Expo** 52.x
- **React Navigation** 6.x
- **Expo SQLite** 11.x
- **Axios** for HTTP requests
- **NetInfo** for network detection

## Usage

### Complete Workflow

1. **Connect to GoPro**:
   - Turn on GoPro WiFi
   - Connect phone to GoPro network in Settings
   - Open app and tap "Connect to GoPro"
   - Test connection and view camera status

2. **Browse & Download**:
   - Tap "Browse Media" to see camera videos
   - Select videos to download
   - Tap "Download Selected"
   - Monitor progress in Download Queue
   - Videos automatically added to library

3. **Manage Videos**:
   - View all videos in Video Library
   - Search by filename or boat name
   - Check storage usage
   - Select videos for operations

4. **Rename Videos**:
   - Select videos to rename
   - Tap "Rename" button
   - Enter boat name (required)
   - Set video date
   - Choose type for each video:
     - Before (first video)
     - After (last video)
     - Custom (middle videos - enter suffix)
     - None (no suffix)
   - Preview renamed filenames
   - Apply rename

5. **Delete Videos**:
   - Select unwanted videos
   - Tap "Delete" button
   - Confirm deletion
   - Files removed from storage

## Next Steps

See `../docs/mobile/PROGRESS.md` for detailed roadmap.

### Phase 4: YouTube Upload (Next)
- YouTube OAuth authentication
- Upload manager with chunked uploads
- Playlist creation and management
- Upload queue with progress
- Batch upload support

### Future Phases
- Phase 5: Cellular Optimization
- Phase 6: Background Processing
- Phase 7: UI/UX Polish
- Phase 8: Testing & Deployment

## Documentation

Full development plan: `../docs/mobile/MOBILE_ROADMAP.md`

## Development

```bash
# Validate project structure
node test-structure.js

# Clear cache
npx expo start -c

# Reset dependencies
rm -rf node_modules && npm install
```