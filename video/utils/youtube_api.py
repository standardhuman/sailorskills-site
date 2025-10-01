import os
import json
import time
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from googleapiclient.http import MediaFileUpload
import logging
import ssl

class YouTubeAPI:
    def __init__(self, config_path='config.json', client_secrets='client_secrets.json'):
        # Load configuration
        self.config_path = config_path
        self.client_secrets_file = client_secrets
        self.scopes = ["https://www.googleapis.com/auth/youtube.upload",
                       "https://www.googleapis.com/auth/youtube"]
        self.api_service_name = "youtube"
        self.api_version = "v3"
        self.youtube = None
        self.credentials = None
        
        # Load the config
        self.reload_config()
    
    def reload_config(self):
        """Reload configuration from file."""
        with open(self.config_path, 'r') as config_file:
            self.config = json.load(config_file)
    
    def get_authenticated_service(self):
        """Get authenticated YouTube service."""
        try:
            # Check if we have stored credentials
            if os.path.exists("token.json"):
                try:
                    with open("token.json", "r") as token_file:
                        token_data = json.load(token_file)
                        self.credentials = google.oauth2.credentials.Credentials.from_authorized_user_info(token_data)
                except (json.JSONDecodeError, ValueError) as e:
                    logging.error(f"Error reading token.json: {e}")
                    # If token file is corrupted, remove it and get new credentials
                    os.remove("token.json")
                    self.credentials = None
            
            # If no valid credentials, get new ones
            if not self.credentials or not self.credentials.valid:
                logging.info("Getting new YouTube API credentials")
                # Instead of using run_local_server, raise an exception
                # The web app will handle authentication through the browser
                raise RuntimeError("YouTube authentication required. Please authenticate through the web interface.")
            
            self.youtube = googleapiclient.discovery.build(
                self.api_service_name, self.api_version, credentials=self.credentials)
            
            return self.youtube
        except Exception as e:
            logging.error(f"Error in get_authenticated_service: {e}")
            raise
    
    def get_playlists(self):
        """Get list of user's playlists."""
        if not self.youtube:
            self.get_authenticated_service()
        
        playlists = []
        request = self.youtube.playlists().list(
            part="snippet,contentDetails",
            mine=True,
            maxResults=50
        )
        
        retries = 3
        delay = 5  # seconds
        while request:
            for i in range(retries):
                try:
                    response = request.execute()
                    break  # Success
                except (googleapiclient.errors.HttpError, TimeoutError) as e:
                    logging.warning(f"Error fetching playlists (attempt {i+1}/{retries}): {e}")
                    if i < retries - 1:
                        logging.info(f"Retrying in {delay} seconds...")
                        time.sleep(delay)
                        delay *= 2  # Exponential backoff
                    else:
                        logging.error("Failed to fetch playlists after multiple retries.")
                        raise  # Re-raise the last exception
            
            if not response: # Should not happen if loop completes or error is raised
                return playlists

            for playlist in response["items"]:
                playlists.append({
                    "id": playlist["id"],
                    "title": playlist["snippet"]["title"],
                    "videoCount": playlist["contentDetails"]["itemCount"]
                })
            
            request = self.youtube.playlists().list_next(request, response)
        
        return playlists
    
    def find_matching_playlist(self, boat_name):
        """Find matching playlist for boat name."""
        playlists = self.get_playlists()
        
        # Try exact match
        for playlist in playlists:
            if playlist["title"].lower() == boat_name.lower():
                return playlist
        
        # Try prefix match
        for playlist in playlists:
            if playlist["title"].lower().startswith(boat_name.lower()):
                return playlist
        
        # Try contains match
        for playlist in playlists:
            if boat_name.lower() in playlist["title"].lower():
                return playlist
        
        return None
    
    def create_playlist(self, boat_name):
        """Create a new playlist for a boat."""
        if not self.youtube:
            self.get_authenticated_service()
        
        request = self.youtube.playlists().insert(
            part="snippet,status",
            body={
                "snippet": {
                    "title": boat_name,
                    # No description for playlists either
                },
                "status": {
                    "privacyStatus": self.config["youtube"]["default_privacy"]
                }
            }
        )
        
        response = request.execute()
        return {
            "id": response["id"],
            "title": response["snippet"]["title"],
            "videoCount": 0
        }
    
    def upload_video(self, video_path, title, description, privacy=None, dry_run=False, progress_callback=None, pause_check=None):
        """Upload a video to YouTube with optional rate throttling and pause/resume support."""
        if dry_run:
            return {
                "success": True,
                "video_id": "dry_run_id",
                "title": title,
                "privacy": privacy or self.config["youtube"]["default_privacy"]
            }
        
        logging.info(f"[YouTubeAPI] Starting upload_video for: {title} (Path: {video_path})")

        if not self.youtube:
            logging.info(f"[YouTubeAPI] Authenticating YouTube service for {title}...")
            self.get_authenticated_service()
            logging.info(f"[YouTubeAPI] YouTube service authenticated for {title}.")
        
        if not privacy:
            privacy = self.config["youtube"]["default_privacy"]
        
        # Create snippet with minimal info (no description)
        snippet = {
            "title": title,
            "tags": ["boat", "marine"]
        }
        
        # Only add description if it's provided and not empty
        if description and description.strip():
            snippet["description"] = description
            
        body = {
            "snippet": snippet,
            "status": {
                "privacyStatus": privacy
            }
        }
        
        # Get file size for progress tracking
        file_size = os.path.getsize(video_path)
        
        # Check if throttling is enabled
        throttling_enabled = False
        max_upload_rate_mbps = 10.0
        
        if "upload" in self.config and "throttling_enabled" in self.config["upload"]:
            throttling_enabled = self.config["upload"]["throttling_enabled"]
            max_upload_rate_mbps = self.config["upload"]["max_upload_rate_mbps"]
        
        # Adjust chunk size based on throttling settings
        # Use smaller chunks when throttling is enabled for better control
        chunk_size = 256 * 1024 if throttling_enabled else 1024 * 1024  # 256KB or 1MB
        
        # Create a media file upload object with progress tracking
        media = MediaFileUpload(video_path, resumable=True, chunksize=chunk_size)
        
        request = self.youtube.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media
        )
        
        # For progress tracking
        response = None
        total_bytes_uploaded_for_file = 0 # Tracks resumable_progress for the file
        # start_time is used by the progress_callback in app.py, not directly here for rate.

        # Variables for throttling rate calculation interval
        interval_start_time = time.time()
        bytes_uploaded_this_interval = 0
        
        logging.info(f"[YouTubeAPI {title}] Entering main upload loop (while response is None).")
        # Use the resumable media upload with throttling
        while response is None:
            # --- ADDED: Pause support ---
            if pause_check:
                while pause_check():
                    logging.info("Upload paused. Waiting to resume...")
                    time.sleep(1)
            # --- END ADDED ---
            # If throttling is enabled, control upload rate
            # This check happens *before* uploading the next chunk.
            # It uses data from the *previous* chunk's successful upload.
            if throttling_enabled and bytes_uploaded_this_interval > 0: # Check if any bytes were part of the last interval to calc rate
                current_time = time.time()
                elapsed_this_interval = current_time - interval_start_time
                
                if elapsed_this_interval > 0:
                    current_rate_mbps = (bytes_uploaded_this_interval * 8) / (elapsed_this_interval * 1000000)

                    if current_rate_mbps > max_upload_rate_mbps:
                        target_time_for_interval_data = (bytes_uploaded_this_interval * 8) / (max_upload_rate_mbps * 1000000)
                        delay_needed = target_time_for_interval_data - elapsed_this_interval
                        if delay_needed > 0:
                            logging.debug(f"Throttling: Current rate {current_rate_mbps:.2f} Mbps (based on {bytes_uploaded_this_interval / (1024*1024):.2f}MB in {elapsed_this_interval:.2f}s), target {max_upload_rate_mbps} Mbps, delaying {delay_needed:.4f}s")
                            time.sleep(delay_needed)
            
            # Reset for the next interval (time will be from after current chunk, bytes will be from current chunk)
            interval_start_time = time.time() # Reset timer before trying to upload next chunk
            bytes_uploaded_this_interval = 0    # Reset byte counter, will be updated after successful chunk
            
            # Upload the next chunk
            chunk_retries = 3
            chunk_delay = 5 # seconds
            logging.debug(f"[YouTubeAPI {title}] Preparing to upload next chunk. Retries left: {chunk_retries}")
            for i in range(chunk_retries):
                try:
                    logging.debug(f"[YouTubeAPI {title}] Attempting request.next_chunk() (Attempt {i+1}/{chunk_retries})")
                    status, response = request.next_chunk()
                    logging.debug(f"[YouTubeAPI {title}] request.next_chunk() returned. Status: {type(status)}, Response: {type(response)}")
                    if status: # Status is not None if upload is in progress
                        # Calculate bytes processed in this specific successful chunk operation
                        bytes_in_this_chunk = status.resumable_progress - total_bytes_uploaded_for_file # total_bytes_uploaded_for_file is from BEFORE this chunk
                        bytes_uploaded_this_interval += bytes_in_this_chunk # Accumulate for current interval rate calc
                        total_bytes_uploaded_for_file = status.resumable_progress # Update total for file for NEXT iteration's delta
                        logging.debug(f"[YouTubeAPI {title}] Chunk uploaded. Progress: {status.progress()*100:.2f}%, Total Bytes: {total_bytes_uploaded_for_file}, Bytes in this chunk: {bytes_in_this_chunk}")
                        
                    if progress_callback and status:
                        progress_callback(status.progress(), file_size, total_bytes_uploaded_for_file)
                    break # Success for this chunk
                except (googleapiclient.errors.HttpError, TimeoutError, ConnectionResetError, ssl.SSLError) as e:
                    logging.warning(f"[YouTubeAPI {title}] Error during chunk upload (attempt {i+1}/{chunk_retries}): {e}")
                    if i < chunk_retries - 1:
                        logging.info(f"Retrying in {chunk_delay} seconds...")
                        time.sleep(chunk_delay)
                        chunk_delay *= 2  # Exponential backoff
                    else:
                        logging.error("Failed to upload chunk after multiple retries.")
                        # If it's a resumable upload error, we might be able to recover by returning None here
                        # but for simplicity, we'll re-raise for now to signal a failed upload.
                        raise  # Re-raise the last exception
            
            logging.debug(f"[YouTubeAPI {title}] After chunk upload attempt(s). Status: {type(status)}, Response: {type(response)}")
            # This block is outside the chunk retry loop.
            # No specific updates needed here for 'status' if it has been handled inside the loop.
            # The `bytes_uploaded_this_interval` and `interval_start_time` are now set correctly for the next iteration's throttling check.

            # If upload is complete, status will be None, and response will be set
            if response:
                logging.info(f"[YouTubeAPI {title}] Upload complete. Video ID: {response.get('id')}")
                return {
                    "success": True,
                    "video_id": response.get("id"),
                    "title": title,
                    "privacy": privacy
                }
        
        # Should not be reached if upload is successful
        logging.error(f"[YouTubeAPI {title}] Upload failed for {title} before completion (exited while loop unexpectedly).")
        return {"success": False, "error": "Upload failed before completion", "title": title}
    
    def add_to_playlist(self, video_id, playlist_id, dry_run=False):
        """Add video to a playlist."""
        if dry_run:
            return {
                "success": True,
                "video_id": video_id,
                "playlist_id": playlist_id
            }
        
        if not self.youtube:
            self.get_authenticated_service()
        
        request = self.youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": video_id
                    }
                }
            }
        )
        
        response = request.execute()
        
        return {
            "success": True,
            "video_id": video_id,
            "playlist_id": playlist_id
        }
