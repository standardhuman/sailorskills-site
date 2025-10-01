import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable web browser to close properly after auth
WebBrowser.maybeCompleteAuthSession();

class YouTubeService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.clientId = ''; // Set from config or environment
    this.clientSecret = ''; // Set from config or environment
    this.redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  }

  /**
   * Initialize service and load saved tokens
   */
  async init() {
    try {
      const savedToken = await AsyncStorage.getItem('youtube_access_token');
      const savedRefresh = await AsyncStorage.getItem('youtube_refresh_token');
      const savedExpiry = await AsyncStorage.getItem('youtube_token_expiry');

      if (savedToken && savedRefresh) {
        this.accessToken = savedToken;
        this.refreshToken = savedRefresh;
        this.tokenExpiry = savedExpiry ? parseInt(savedExpiry) : null;

        // Check if token is expired and refresh if needed
        if (this.isTokenExpired()) {
          await this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Failed to load saved tokens:', error);
    }
  }

  /**
   * Check if current access token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Authenticate with Google/YouTube OAuth
   */
  async authenticate() {
    try {
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
          clientId: this.clientId,
          scopes: [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube'
          ],
          redirectUri: this.redirectUri,
        },
        discovery
      );

      const result = await promptAsync();

      if (result.type === 'success') {
        const { code } = result.params;
        await this.exchangeCodeForTokens(code);
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Exchange authorization code for access/refresh tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token, refresh_token, expires_in } = response.data;

      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiry = Date.now() + (expires_in * 1000);

      // Save tokens
      await AsyncStorage.setItem('youtube_access_token', access_token);
      await AsyncStorage.setItem('youtube_refresh_token', refresh_token);
      await AsyncStorage.setItem('youtube_token_expiry', this.tokenExpiry.toString());
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token'
      });

      const { access_token, expires_in } = response.data;

      this.accessToken = access_token;
      this.tokenExpiry = Date.now() + (expires_in * 1000);

      await AsyncStorage.setItem('youtube_access_token', access_token);
      await AsyncStorage.setItem('youtube_token_expiry', this.tokenExpiry.toString());
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Ensure valid access token before API calls
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Get user's YouTube playlists
   */
  async getPlaylists() {
    await this.ensureValidToken();

    try {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlists',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          },
          params: {
            part: 'snippet',
            mine: true,
            maxResults: 50
          }
        }
      );

      return response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description
      }));
    } catch (error) {
      throw new Error(`Failed to get playlists: ${error.message}`);
    }
  }

  /**
   * Find playlist by boat name (fuzzy matching)
   */
  findPlaylistByBoatName(playlists, boatName) {
    if (!boatName) return null;

    const lowerBoatName = boatName.toLowerCase();

    // Exact match
    let match = playlists.find(p => p.title.toLowerCase() === lowerBoatName);
    if (match) return match;

    // Starts with
    match = playlists.find(p => p.title.toLowerCase().startsWith(lowerBoatName));
    if (match) return match;

    // Contains
    match = playlists.find(p => p.title.toLowerCase().includes(lowerBoatName));
    return match;
  }

  /**
   * Create new YouTube playlist
   */
  async createPlaylist(title, description = '') {
    await this.ensureValidToken();

    try {
      const response = await axios.post(
        'https://www.googleapis.com/youtube/v3/playlists',
        {
          snippet: {
            title,
            description: description || `Videos for ${title}`
          },
          status: {
            privacyStatus: 'unlisted'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            part: 'snippet,status'
          }
        }
      );

      return {
        id: response.data.id,
        title: response.data.snippet.title,
        description: response.data.snippet.description
      };
    } catch (error) {
      throw new Error(`Failed to create playlist: ${error.message}`);
    }
  }

  /**
   * Initialize resumable upload session
   */
  async initiateResumableUpload(videoMetadata) {
    await this.ensureValidToken();

    try {
      const response = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos',
        {
          snippet: {
            title: videoMetadata.title,
            description: videoMetadata.description || '',
            categoryId: '22' // People & Blogs
          },
          status: {
            privacyStatus: videoMetadata.privacy || 'unlisted'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'video/*'
          },
          params: {
            uploadType: 'resumable',
            part: 'snippet,status'
          }
        }
      );

      return response.headers.location; // Upload URL
    } catch (error) {
      throw new Error(`Failed to initiate upload: ${error.message}`);
    }
  }

  /**
   * Upload video in chunks with progress tracking
   */
  async uploadVideoChunked(uploadUrl, filePath, onProgress) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSize = fileInfo.size;
      const chunkSize = 1024 * 1024; // 1MB chunks

      let uploadedBytes = 0;

      while (uploadedBytes < fileSize) {
        const start = uploadedBytes;
        const end = Math.min(uploadedBytes + chunkSize, fileSize);
        const chunk = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.Base64,
          position: start,
          length: end - start
        });

        const chunkBuffer = Buffer.from(chunk, 'base64');

        const response = await axios.put(uploadUrl, chunkBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`
          }
        });

        uploadedBytes = end;

        if (onProgress) {
          onProgress({
            bytesUploaded: uploadedBytes,
            totalBytes: fileSize,
            percent: (uploadedBytes / fileSize) * 100
          });
        }

        // Check if upload is complete
        if (response.status === 200 || response.status === 201) {
          return response.data.id; // Video ID
        }
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Add video to playlist
   */
  async addVideoToPlaylist(videoId, playlistId) {
    await this.ensureValidToken();

    try {
      await axios.post(
        'https://www.googleapis.com/youtube/v3/playlistItems',
        {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            part: 'snippet'
          }
        }
      );
    } catch (error) {
      throw new Error(`Failed to add video to playlist: ${error.message}`);
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.accessToken !== null && !this.isTokenExpired();
  }

  /**
   * Sign out
   */
  async signOut() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    await AsyncStorage.removeItem('youtube_access_token');
    await AsyncStorage.removeItem('youtube_refresh_token');
    await AsyncStorage.removeItem('youtube_token_expiry');
  }
}

// Export singleton instance
const youtubeService = new YouTubeService();
export default youtubeService;