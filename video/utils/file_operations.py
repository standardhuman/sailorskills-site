import os
import shutil
import datetime
import json
from datetime import datetime
import logging
import re

class FileOperations:
    def __init__(self, config_path='config.json'):
        # Load configuration
        self.config_path = config_path
        self.reload_config()
        
        # Initialize rename log
        self.rename_log = []
        
        # Initialize deleted videos log for undo functionality
        self.deleted_videos_log = []
    
    def reload_config(self):
        """Reload configuration from file."""
        with open(self.config_path, 'r') as config_file:
            self.config = json.load(config_file)
        
        # Initialize directories
        self.source_dir = self.config['directories']['source']
        self.upload_dir = self.config['directories']['upload']
        self.archive_dir = self.config['directories']['archive']
        
        # Create directories if they don't exist
        os.makedirs(self.source_dir, exist_ok=True)
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.archive_dir, exist_ok=True)
    
    def sanitize_filename(self, filename):
        """Sanitize filename by removing/replacing invalid characters."""
        # Remove file extension for processing
        name_parts = filename.rsplit('.', 1)
        name = name_parts[0]
        ext = name_parts[1] if len(name_parts) > 1 else ''
        
        # Replace common invalid characters with safe alternatives
        replacements = {
            '/': '-',
            '\\': '-',
            ':': '-',
            '*': '-',
            '?': '-',
            '"': '',
            '<': '-',
            '>': '-',
            '|': '-',
            '\n': ' ',
            '\r': ' ',
            '\t': ' '
        }
        
        for char, replacement in replacements.items():
            name = name.replace(char, replacement)
        
        # Remove any other non-printable characters
        name = re.sub(r'[^\x20-\x7E]', '', name)
        
        # Remove multiple consecutive spaces or dashes
        name = re.sub(r'\s+', ' ', name)
        name = re.sub(r'-+', '-', name)
        
        # Trim spaces and dashes from ends
        name = name.strip(' -')
        
        # Ensure name is not empty
        if not name:
            name = 'unnamed'
        
        # Reconstruct filename with extension
        return f"{name}.{ext}" if ext else name
    
    def get_source_videos(self):
        """Get list of video files in the source directory."""
        video_extensions = ['.mp4', '.mov', '.avi', '.wmv']
        videos = []
        
        for filename in os.listdir(self.source_dir):
            file_path = os.path.join(self.source_dir, filename)
            if os.path.isfile(file_path) and os.path.splitext(filename)[1].lower() in video_extensions:
                # Get file size in bytes and convert to MB
                file_size_bytes = os.path.getsize(file_path)
                file_size_mb = file_size_bytes / (1024 * 1024)
                
                videos.append({
                    'name': filename,
                    'path': file_path,
                    'created': os.path.getctime(file_path),
                    'size_bytes': file_size_bytes,
                    'size_mb': round(file_size_mb, 2)
                })
        
        # Sort by creation time (oldest first)
        videos.sort(key=lambda x: x['created'])
        return videos
    
    def get_upload_ready_videos(self):
        """Get list of videos ready for upload."""
        video_extensions = ['.mp4', '.mov', '.avi', '.wmv']
        videos = []
        
        for filename in os.listdir(self.upload_dir):
            file_path = os.path.join(self.upload_dir, filename)
            if os.path.isfile(file_path) and os.path.splitext(filename)[1].lower() in video_extensions:
                # Get file size in bytes and convert to MB
                file_size_bytes = os.path.getsize(file_path)
                file_size_mb = file_size_bytes / (1024 * 1024)
                
                videos.append({
                    'name': filename,
                    'path': file_path,
                    'size_bytes': file_size_bytes,
                    'size_mb': round(file_size_mb, 2)
                })
        
        # Group by boat name
        boat_videos = {}
        for video in videos:
            # Extract boat name from filename (everything before the date)
            parts = video['name'].split()
            # Find the part that looks like a date (MM-DD-YYYY)
            date_index = -1
            for i, part in enumerate(parts):
                if len(part) == 10 and part[2] == '-' and part[5] == '-':
                    date_index = i
                    break
            
            if date_index > 0:
                boat_name = ' '.join(parts[:date_index])
                if boat_name not in boat_videos:
                    boat_videos[boat_name] = []
                boat_videos[boat_name].append(video)
        
        return boat_videos
    
    def rename_videos(self, boat_names, selected_date, videos_per_boat, custom_suffixes=None):
        """Rename videos based on boat names and selected date."""
        if custom_suffixes is None:
            custom_suffixes = {}
        
        source_videos = self.get_source_videos()
        
        if not source_videos:
            # If there are no source videos, assume they might already be renamed.
            # Return success to allow UI to proceed to upload step.
            # loadUploadReadyVideos() in JS should populate the list for Step 3.
            return {"success": True, "renamed": 0, "deleted": 0, "message": "No source videos found, proceeding to upload step."}
        
        # Sort videos by filename alphanumerically instead of creation time
        # This ensures the first boat name matches the lowest value alphanumeric filename
        source_videos.sort(key=lambda v: v['name'].lower())
        
        # Format the date string - handle both string and datetime objects
        if isinstance(selected_date, str):
            date_str = selected_date
        else:
            # Format datetime object to string
            date_str = selected_date.strftime("%m-%d-%Y")
        
        # Clear the rename log
        self.rename_log = []
        
        video_index = 0
        for boat_name in boat_names:
            boat_name = boat_name.strip()
            if not boat_name:
                continue
                
            for i in range(videos_per_boat):
                if video_index >= len(source_videos):
                    return {"success": False, "error": f"Not enough source videos for all boats"}
                
                source_video = source_videos[video_index]
                source_path = source_video['path']
                source_ext = os.path.splitext(source_path)[1]
                
                # Determine suffix
                suffix = ""
                if videos_per_boat == 1:
                    # If only one video per boat, no suffix
                    suffix = ""
                elif videos_per_boat == 2:
                    # If two videos per boat, use Before/After
                    suffix = " (Before)" if i == 0 else " (After)"
                else:
                    # If more than two videos, use custom suffixes or default to position
                    suffix_key = f"{boat_name}_{i+1}"
                    if suffix_key in custom_suffixes and custom_suffixes[suffix_key]:
                        suffix = f" ({custom_suffixes[suffix_key]})"
                    elif i == 0:
                        suffix = " (Before)"
                    elif i == videos_per_boat - 1:
                        suffix = " (After)"
                    else:
                        suffix = f" ({custom_suffixes[suffix_key] if suffix_key in custom_suffixes else f'Item of note {i}'})"
                
                # Create new filename with sanitization
                new_filename = f"{boat_name} {date_str} {i+1}{suffix}{source_ext}"
                new_filename = self.sanitize_filename(new_filename)
                dest_path = os.path.join(self.upload_dir, new_filename)
                
                # Move file to destination instead of copying
                try:
                    # First copy the file to ensure it's successful
                    shutil.copy2(source_path, dest_path)
                    
                    # Log the rename operation for possible undo
                    self.rename_log.append({
                        "source": source_path,
                        "destination": dest_path,
                        "original_exists": True  # Flag to track if original still exists
                    })
                    
                    video_index += 1
                except Exception as e:
                    logging.error(f"Error copying file {source_path} to {dest_path}: {str(e)}")
                    return {"success": False, "error": f"Error copying file: {str(e)}"}
        
        # After all files are successfully copied, delete the source files
        deleted_count = 0
        for entry in self.rename_log:
            try:
                if os.path.exists(entry["source"]):
                    os.remove(entry["source"])
                    deleted_count += 1
            except Exception as e:
                logging.error(f"Error deleting source file {entry['source']}: {str(e)}")
                # Don't fail the operation if deletion fails
        
        return {"success": True, "renamed": len(self.rename_log), "deleted": deleted_count}
    
    def rename_videos_custom(self, assignments):
        """Rename videos based on custom per-video assignments."""
        # Clear the rename log
        self.rename_log = []
        
        # Group assignments by source path to avoid duplicates
        processed_sources = set()
        
        for assignment in assignments:
            source_path = assignment['source_path']
            
            # Skip if already processed
            if source_path in processed_sources:
                continue
            
            # Skip if source doesn't exist
            if not os.path.exists(source_path):
                continue
            
            # Parse date if provided as string
            date_str = assignment.get('date', datetime.now().strftime("%Y-%m-%d"))
            if isinstance(date_str, str) and len(date_str) == 10:
                # Convert YYYY-MM-DD to MM-DD-YYYY
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    date_str = date_obj.strftime("%m-%d-%Y")
                except:
                    date_str = datetime.now().strftime("%m-%d-%Y")
            
            # Build filename
            boat_name = assignment.get('boat_name', '').strip()
            video_type = assignment.get('type', '')
            position = assignment.get('position', 1)
            
            # Validate boat name
            if not boat_name:
                logging.warning(f"Skipping video {source_path} - empty boat name")
                continue
            
            # Get file extension
            source_ext = os.path.splitext(source_path)[1]
            
            # Build suffix
            suffix = ""
            if video_type and video_type not in ["Other", ""]:
                suffix = f" ({video_type})"
            
            # Create new filename with sanitization
            new_filename = f"{boat_name} {date_str} {position}{suffix}{source_ext}"
            new_filename = self.sanitize_filename(new_filename)
            dest_path = os.path.join(self.upload_dir, new_filename)
            
            # Copy file to destination
            try:
                shutil.copy2(source_path, dest_path)
                
                # Log the rename operation for possible undo
                self.rename_log.append({
                    "source": source_path,
                    "destination": dest_path,
                    "original_exists": True
                })
                
                processed_sources.add(source_path)
                
            except Exception as e:
                logging.error(f"Error copying file {source_path} to {dest_path}: {str(e)}")
                # Continue with other files
        
        # After all files are successfully copied, delete the source files
        deleted_count = 0
        for entry in self.rename_log:
            try:
                if os.path.exists(entry["source"]):
                    os.remove(entry["source"])
                    deleted_count += 1
            except Exception as e:
                logging.error(f"Error deleting source file {entry['source']}: {str(e)}")
                # Don't fail the operation if deletion fails
        
        return {"success": True, "renamed": len(self.rename_log), "deleted": deleted_count}
    
    def undo_rename(self):
        """Undo the last rename operation."""
        if not self.rename_log:
            return {"success": False, "error": "No rename operations to undo"}
        
        restored_count = 0
        
        for operation in self.rename_log:
            source_path = operation["source"]
            dest_path = operation["destination"]
            
            # First check if the destination file exists
            if os.path.exists(dest_path):
                try:
                    # Copy the file back to its original location
                    if not os.path.exists(source_path):
                        shutil.copy2(dest_path, source_path)
                        restored_count += 1
                    
                    # Remove the renamed file
                    os.remove(dest_path)
                except Exception as e:
                    logging.error(f"Error during undo operation: {str(e)}")
                    # Continue with other files even if one fails
        
        # Clear the log after undo
        count = len(self.rename_log)
        self.rename_log = []
        
        return {"success": True, "undone": count, "restored": restored_count}
        
    def delete_source_video(self, file_path):
        """Delete a source video file."""
        try:
            # Verify the file exists and is in the source directory
            if not os.path.exists(file_path):
                return {"success": False, "error": "File does not exist"}
                
            if not file_path.startswith(self.source_dir):
                return {"success": False, "error": "File is not in the source directory"}
            
            # Backup the file before deletion
            filename = os.path.basename(file_path)
            backup_dir = os.path.join(self.archive_dir, "deleted_temp")
            os.makedirs(backup_dir, exist_ok=True)
            backup_path = os.path.join(backup_dir, filename)
            
            # Copy the file to backup location
            shutil.copy2(file_path, backup_path)
            
            # Add to deleted videos log
            self.deleted_videos_log.append({
                "original_path": file_path,
                "backup_path": backup_path,
                "filename": filename,
                "deleted_time": datetime.now().timestamp()
            })
            
            # Keep only the last 50 deleted videos in the log
            if len(self.deleted_videos_log) > 50:
                old_entry = self.deleted_videos_log.pop(0)
                # Remove the backup file for the oldest entry
                if os.path.exists(old_entry["backup_path"]):
                    os.remove(old_entry["backup_path"])
                
            # Delete the file
            os.remove(file_path)
            return {"success": True, "file": filename, "can_undo": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def undo_delete_video(self, filename):
        """Restore a deleted source video."""
        try:
            # Find the video in the deleted log
            entry = None
            for item in self.deleted_videos_log:
                if item["filename"] == filename:
                    entry = item
                    break
            
            if not entry:
                return {"success": False, "error": f"Video {filename} not found in deletion history"}
            
            # Check if backup exists
            if not os.path.exists(entry["backup_path"]):
                return {"success": False, "error": "Backup file no longer exists"}
            
            # Restore the file
            shutil.copy2(entry["backup_path"], entry["original_path"])
            
            # Remove from deleted log
            self.deleted_videos_log.remove(entry)
            
            return {"success": True, "file": filename}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_deleted_videos(self):
        """Get list of recently deleted videos that can be restored."""
        return [
            {
                "filename": entry["filename"],
                "original_path": entry["original_path"],
                "deleted_time": entry["deleted_time"]
            }
            for entry in self.deleted_videos_log
        ]
    
    def archive_video(self, video_path):
        """Move a video to the archive directory."""
        # Create archive subdirectory based on current month
        today = datetime.now()
        month_dir = os.path.join(self.archive_dir, today.strftime("%Y-%m"))
        os.makedirs(month_dir, exist_ok=True)
        
        # Move the file
        filename = os.path.basename(video_path)
        dest_path = os.path.join(month_dir, filename)
        
        shutil.move(video_path, dest_path)
        return dest_path
