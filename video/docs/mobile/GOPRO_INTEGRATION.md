# GoPro WiFi API Integration Guide

Complete reference for GoPro camera HTTP API integration.

## GoPro WiFi Basics

### Connection
- **SSID Pattern**: `GP*` (e.g., `GP24500123`)
- **Password**: Usually printed on camera or in settings
- **IP Address**: `10.5.5.9` (standard for all GoPro cameras)
- **Port**: `8080`
- **Protocol**: HTTP (not HTTPS)

### Supported Models
- GoPro Hero 9 Black
- GoPro Hero 10 Black
- GoPro Hero 11 Black
- GoPro Hero 12 Black

---

## API Endpoints

### Base URL
```
http://10.5.5.9:8080
```

### 1. Camera Info
Get camera model, firmware, status.

```http
GET /gp/gpControl/info
```

**Response**:
```json
{
  "info": {
    "model_number": 62,
    "model_name": "HERO11 Black",
    "firmware_version": "01.10.00",
    "serial_number": "C3xxxxxxxxxx"
  }
}
```

### 2. Camera Status
Get battery, SD card, recording status.

```http
GET /gp/gpControl/status
```

**Response**:
```json
{
  "status": {
    "1": 1,     // Internal battery (0-4 bars)
    "2": 4,     // Internal battery percentage
    "8": 0,     // Recording (0=not recording)
    "38": 0,    // Current video resolution
    "54": 0     // SD card status (0=ok)
  }
}
```

**Key Status Codes**:
- `1`: Battery level (0-4)
- `2`: Battery percentage (0-100)
- `8`: Recording status (0=not recording, 1=recording)
- `54`: SD card inserted (0=inserted)

### 3. Media List
Get list of all videos/photos on SD card.

```http
GET /gp/gpMediaList
```

**Response**:
```json
{
  "media": [{
    "d": "100GOPRO",
    "fs": [{
      "n": "GH010123.MP4",
      "s": "4127463424",
      "mod": "1698765432"
    }]
  }]
}
```

**Fields**:
- `d`: Directory name
- `n`: Filename
- `s`: File size in bytes
- `mod`: Modified timestamp (Unix)

### 4. Download Media File
Download video or photo file.

```http
GET /videos/DCIM/100GOPRO/GH010123.MP4
```

**Headers** (for resumable download):
```http
Range: bytes=0-1048575
```

**Response**: Binary video data

### 5. Thumbnail
Get video thumbnail (if available).

```http
GET /gp/gpMediaMetadata?p=100GOPRO/GH010123.MP4&t=b
```

---

## Connection Workflow

### 1. Discovery
```javascript
import WifiManager from 'react-native-wifi-reborn';

async function discoverGoPro() {
  // Get list of WiFi networks
  const networks = await WifiManager.loadWifiList();

  // Find GoPro network (starts with "GP")
  const gopro = networks.find(n => n.SSID.startsWith('GP'));

  return gopro;
}
```

### 2. Connect
```javascript
async function connectToGoPro(ssid, password) {
  await WifiManager.connectToProtectedSSID(ssid, password, false);

  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verify connection
  const currentSSID = await WifiManager.getCurrentWifiSSID();
  return currentSSID === ssid;
}
```

### 3. Test Connection
```javascript
async function testGoProConnection() {
  try {
    const response = await fetch('http://10.5.5.9:8080/gp/gpControl/info', {
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

## Download Implementation

### Basic Download
```javascript
import RNFS from 'react-native-fs';

async function downloadVideo(filename, localPath) {
  const url = `http://10.5.5.9:8080/videos/DCIM/100GOPRO/${filename}`;

  const download = RNFS.downloadFile({
    fromUrl: url,
    toFile: localPath,
    progress: (res) => {
      const progress = (res.bytesWritten / res.contentLength) * 100;
      console.log(`Progress: ${progress.toFixed(2)}%`);
    },
    progressDivider: 10
  });

  await download.promise;
}
```

### Resumable Download
```javascript
async function resumableDownload(filename, localPath) {
  // Check if partial file exists
  const exists = await RNFS.exists(localPath);
  let bytesDownloaded = 0;

  if (exists) {
    const stat = await RNFS.stat(localPath);
    bytesDownloaded = parseInt(stat.size);
  }

  const url = `http://10.5.5.9:8080/videos/DCIM/100GOPRO/${filename}`;

  const download = RNFS.downloadFile({
    fromUrl: url,
    toFile: localPath,
    headers: {
      'Range': `bytes=${bytesDownloaded}-`
    },
    background: true,
    discretionary: true,
    cacheable: false
  });

  return download.promise;
}
```

### Parallel Downloads
```javascript
async function downloadMultiple(files, maxConcurrent = 2) {
  const queue = [...files];
  const active = [];
  const completed = [];

  while (queue.length > 0 || active.length > 0) {
    // Start new downloads
    while (active.length < maxConcurrent && queue.length > 0) {
      const file = queue.shift();
      const promise = downloadVideo(file.name, file.localPath)
        .then(() => {
          completed.push(file);
          const index = active.indexOf(promise);
          active.splice(index, 1);
        });
      active.push(promise);
    }

    // Wait for any download to complete
    if (active.length > 0) {
      await Promise.race(active);
    }
  }

  return completed;
}
```

---

## Complete Service Class

```javascript
import axios from 'axios';
import RNFS from 'react-native-fs';
import WifiManager from 'react-native-wifi-reborn';

class GoProService {
  constructor() {
    this.baseURL = 'http://10.5.5.9:8080';
    this.timeout = 30000;
    this.connected = false;
  }

  async connect(ssid, password) {
    await WifiManager.connectToProtectedSSID(ssid, password, false);
    await this.waitForConnection();
    this.connected = await this.testConnection();
    return this.connected;
  }

  async waitForConnection(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (await this.testConnection()) return true;
    }
    throw new Error('Connection timeout');
  }

  async testConnection() {
    try {
      await axios.get(`${this.baseURL}/gp/gpControl/info`, {
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCameraInfo() {
    const response = await axios.get(`${this.baseURL}/gp/gpControl/info`);
    return response.data.info;
  }

  async getCameraStatus() {
    const response = await axios.get(`${this.baseURL}/gp/gpControl/status`);
    return {
      battery: response.data.status['2'],
      recording: response.data.status['8'] === 1,
      sdCard: response.data.status['54'] === 0
    };
  }

  async getMediaList() {
    const response = await axios.get(`${this.baseURL}/gp/gpMediaList`);
    const videos = [];

    response.data.media.forEach(dir => {
      dir.fs.forEach(file => {
        if (file.n.endsWith('.MP4')) {
          videos.push({
            filename: file.n,
            directory: dir.d,
            size: parseInt(file.s),
            modified: new Date(file.mod * 1000)
          });
        }
      });
    });

    return videos;
  }

  async downloadVideo(filename, directory, localPath, onProgress) {
    const url = `${this.baseURL}/videos/DCIM/${directory}/${filename}`;

    const download = RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
      progress: (res) => {
        if (onProgress) {
          onProgress({
            bytesWritten: res.bytesWritten,
            contentLength: res.contentLength,
            percent: (res.bytesWritten / res.contentLength) * 100
          });
        }
      },
      progressDivider: 10
    });

    return download.promise;
  }

  disconnect() {
    this.connected = false;
  }
}

export default new GoProService();
```

---

## Usage Example

```javascript
import GoProService from './services/GoProService';

async function goProWorkflow() {
  try {
    // 1. Connect to GoPro WiFi
    const connected = await GoProService.connect('GP24500123', 'password');
    if (!connected) throw new Error('Connection failed');

    // 2. Get camera info
    const info = await GoProService.getCameraInfo();
    console.log('Camera:', info.model_name);

    // 3. Check battery
    const status = await GoProService.getCameraStatus();
    console.log('Battery:', status.battery + '%');

    // 4. Get video list
    const videos = await GoProService.getMediaList();
    console.log('Videos:', videos.length);

    // 5. Download first video
    const video = videos[0];
    const localPath = `${RNFS.DocumentDirectoryPath}/${video.filename}`;

    await GoProService.downloadVideo(
      video.filename,
      video.directory,
      localPath,
      (progress) => {
        console.log(`Progress: ${progress.percent.toFixed(2)}%`);
      }
    );

    console.log('Download complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Troubleshooting

### Connection Issues
- Verify GoPro WiFi is enabled (camera settings)
- Check phone WiFi settings (forget and reconnect)
- Disable cellular data during GoPro connection
- Ensure camera is awake (not in sleep mode)

### Slow Downloads
- GoPro WiFi is limited to ~10MB/s
- Battery level affects performance
- Distance from camera matters
- Avoid interference (other devices)

### Timeouts
- Increase timeout for large files
- Implement retry logic (exponential backoff)
- Keep camera awake (disable auto-sleep)
- Use keep-alive requests during download

---

**Last Updated**: 2025-09-29