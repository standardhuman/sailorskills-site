import sys
import subprocess
"""
BOATY - Boat Organizer & Automated Transfer to YouTube
Main Flask Application
"""

import os
import json
import threading
import datetime
import time
from datetime import datetime
from flask import Flask, render_template, request, jsonify, url_for, send_file

# Import utility modules
from utils.file_operations import FileOperations
from utils.youtube_api import YouTubeAPI
from utils.logging import setup_logging, OperationLogger

# Initialize logging
logger = setup_logging()
operation_logger = OperationLogger()

# Load configuration
with open('config.json', 'r') as config_file:
    config = json.load(config_file)

# Add video settings if not present
if 'video' not in config:
    config['video'] = {
        'min_size_mb': 1.0,
        'max_size_mb': 500.0
    }
    # Save the updated config
    with open('config.json', 'w') as config_file:
        json.dump(config, config_file, indent=2)

# Initialize utilities
file_ops = FileOperations('config.json')
youtube_api = YouTubeAPI('config.json')

# Upload queue and status
upload_queue = []
upload_status = {
    'active': False,
    'total': 0,
    'completed': 0,
    'failed': 0,
    'in_progress': 0,
    'complete': True,
    'recent_uploads': [],
    'cancel_requested': False,
    'current_upload': None,  # Track the currently uploading video
    'completed_uploads': [],  # Track completed upload IDs
    'failed_uploads': [],    # Track failed upload IDs
    'pending_uploads': [],    # Track pending upload IDs
    'paused': False          # --- ADDED: paused flag ---
}

# Create Flask app
app = Flask(__name__)

# App version information
APP_VERSION = "1.2.0"  # Semantic versioning: MAJOR.MINOR.PATCH
LAST_UPDATED = "2025-03-25"  # Update this date whenever code changes are made

# Add cache busting version (still needed for browser caching)
CACHE_VERSION = str(int(time.time()))

# Add template globals for version info and cache busting
@app.context_processor
def inject_version():
    return dict(
        version=CACHE_VERSION,
        app_version=APP_VERSION,
        last_updated=LAST_UPDATED
    )

# Ensure directories exist
os.makedirs(config['directories']['source'], exist_ok=True)
os.makedirs(config['directories']['upload'], exist_ok=True)
os.makedirs(config['directories']['archive'], exist_ok=True)

@app.route('/')
def index():
    """Render the main page."""
    # Get throttling settings from config, default to disabled/10Mbps if not present
    throttling_enabled = config.get('upload', {}).get('throttling_enabled', False)
    max_upload_rate = config.get('upload', {}).get('max_upload_rate_mbps', 10.0)
    
    return render_template('index.html', 
                           source_dir=config['directories']['source'],
                           upload_dir=config['directories']['upload'],
                           archive_dir=config['directories']['archive'],
                           youtube_privacy=config['youtube']['default_privacy'],
                           auto_create_playlists=config['youtube']['auto_create_playlists'],
                           min_video_size=config['video']['min_size_mb'],
                           max_video_size=config['video']['max_size_mb'],
                           throttling_enabled=throttling_enabled,
                           max_upload_rate=max_upload_rate)

@app.route('/api/source-videos')
def get_source_videos():
    """API endpoint to get source videos."""
    videos = file_ops.get_source_videos()
    return jsonify({'videos': videos})

@app.route('/api/upload-ready-videos')
def get_upload_ready_videos():
    """API endpoint to get upload-ready videos."""
    videos = file_ops.get_upload_ready_videos()
    return jsonify({'videos': videos})

@app.route('/video/<path:filename>')
def serve_video(filename):
    """Serve a video file for preview."""
    # Security check: only allow access to videos in the upload directory
    safe_path = os.path.normpath(os.path.join(config['directories']['upload'], filename))
    directory = os.path.normpath(config['directories']['upload'])
    
    if not safe_path.startswith(directory):
        return "Access denied", 403
        
    # Check if file exists
    if not os.path.exists(safe_path) or not os.path.isfile(safe_path):
        return "File not found", 404
        
    return send_file(safe_path)

@app.route('/api/preview-rename', methods=['POST'])
def preview_rename():
    """API endpoint to preview rename operation."""
    data = request.json
    
    try:
        boat_names = data.get('boat_names', [])
        selected_date_str = data.get('selected_date')
        videos_per_boat = int(data.get('videos_per_boat', 2))
        
        # Validate input
        if not selected_date_str:
            return jsonify({'success': False, 'error': 'Please select a date for the videos.'})
        
        # Filter out empty boat names and validate
        boat_names = [name.strip() for name in boat_names if name and name.strip()]
        if not boat_names:
            return jsonify({'success': False, 'error': 'Please enter at least one boat name.'})
        
        # Parse the selected date
        try:
            selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d')
            date_str = selected_date.strftime("%m-%d-%Y")
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format. Please use YYYY-MM-DD.'})
        
        # Get source videos
        source_videos = file_ops.get_source_videos()
        
        if not source_videos:
            return jsonify({'success': False, 'error': 'No source videos found'})
        
        # Sort videos by filename alphanumerically
        source_videos.sort(key=lambda v: v['name'].lower())
        
        # Generate preview assignments
        assignments = []
        video_index = 0
        
        for boat_name in boat_names:
            boat_name = boat_name.strip()
            if not boat_name:
                continue
                
            for i in range(videos_per_boat):
                if video_index >= len(source_videos):
                    break
                
                source_video = source_videos[video_index]
                
                # Determine default type
                video_type = "Other"
                if videos_per_boat == 1:
                    video_type = "Inspection"
                elif videos_per_boat == 2:
                    video_type = "Before" if i == 0 else "After"
                else:
                    if i == 0:
                        video_type = "Before"
                    elif i == videos_per_boat - 1:
                        video_type = "After"
                    else:
                        video_type = f"Item {i}"
                
                # Generate preview filename
                suffix = f" ({video_type})" if video_type not in ["Other", ""] else ""
                ext = os.path.splitext(source_video['name'])[1]
                preview_name = f"{boat_name} {date_str} {i+1}{suffix}{ext}"
                # Apply sanitization to show what the actual filename will be
                preview_name = file_ops.sanitize_filename(preview_name)
                
                assignments.append({
                    'index': video_index,
                    'source_name': source_video['name'],
                    'source_path': source_video['path'],
                    'boat_name': boat_name,
                    'date': selected_date_str,
                    'type': video_type,
                    'position': i + 1,
                    'preview_name': preview_name
                })
                
                video_index += 1
        
        # Add any unassigned videos
        unassigned = []
        while video_index < len(source_videos):
            source_video = source_videos[video_index]
            unassigned.append({
                'index': video_index,
                'source_name': source_video['name'],
                'source_path': source_video['path']
            })
            video_index += 1
        
        return jsonify({
            'success': True,
            'assignments': assignments,
            'unassigned': unassigned,
            'total_videos': len(source_videos)
        })
    
    except Exception as e:
        logger.exception("Error generating rename preview")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/rename-videos', methods=['POST'])
def rename_videos():
    """API endpoint to rename videos."""
    data = request.json
    
    try:
        # Check if we have individual assignments or bulk rename
        if 'assignments' in data:
            # New per-video rename mode
            assignments = data['assignments']
            result = file_ops.rename_videos_custom(assignments)
        else:
            # Legacy bulk rename mode
            boat_names = data['boat_names']
            selected_date_str = data['selected_date']
            videos_per_boat = int(data['videos_per_boat'])
            custom_suffixes = data.get('custom_suffixes', {})
            
            # Parse the selected date
            selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d')
            
            # Rename the videos
            result = file_ops.rename_videos(boat_names, selected_date, videos_per_boat, custom_suffixes)
        
        # Log the operation
        if result['success']:
            logger.info(f"Renamed {result['renamed']} videos")
        else:
            logger.error(f"Rename operation failed: {result['error']}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception("Error renaming videos")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/undo-rename', methods=['POST'])
def undo_rename():
    """API endpoint to undo the last rename operation."""
    try:
        result = file_ops.undo_rename()
        
        if result['success']:
            logger.info(f"Undid rename operation for {result['undone']} videos")
        else:
            logger.warning(f"Undo operation failed: {result['error']}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception("Error undoing rename")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/upload-videos', methods=['POST'])
def upload_videos():
    """API endpoint to upload videos to YouTube."""
    global upload_queue, upload_status
    
    data = request.json
    dry_run = data.get('dry_run', False)
    
    try:
        # Get upload-ready videos
        boat_videos = file_ops.get_upload_ready_videos()
        if not boat_videos:
            return jsonify({'success': False, 'error': 'No videos ready for upload'})

        # For dry run reporting
        dry_run_report = {
            'boats': {},
            'playlists': {
                'existing': [],
                'to_create': []
            },
            'videos': []
        }

        # Prepare the upload queue (for both dry run and real run)
        upload_queue_temp = []
        
        # Check YouTube authentication before proceeding
        try:
            # This will trigger authentication if needed
            youtube_api.get_authenticated_service()
        except RuntimeError as e:
            if "YouTube authentication required" in str(e):
                return jsonify({
                    'success': False,
                    'error': 'YouTube authentication required. Please authenticate through the web interface.'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': str(e)
                })
        except Exception as e:
            logger.error(f"Error authenticating YouTube service: {e}")
            return jsonify({
                'success': False,
                'error': f'Failed to authenticate with YouTube: {str(e)}'
            })
        
        for boat_name, videos in boat_videos.items():
            # Initialize boat report for dry run
            if dry_run and boat_name not in dry_run_report['boats']:
                dry_run_report['boats'][boat_name] = {
                    'video_count': 0,
                    'has_playlist': False
                }

            # Find or create a matching playlist
            playlist = youtube_api.find_matching_playlist(boat_name)

            # Record playlist status for dry run
            if dry_run:
                if playlist:
                    dry_run_report['boats'][boat_name]['has_playlist'] = True
                    if playlist not in dry_run_report['playlists']['existing']:
                        dry_run_report['playlists']['existing'].append({
                            'name': playlist['title'],
                            'id': playlist['id'],
                            'video_count': playlist['videoCount']
                        })
                elif config['youtube']['auto_create_playlists']:
                    dry_run_report['playlists']['to_create'].append(boat_name)

            if not playlist and config['youtube']['auto_create_playlists'] and not dry_run:
                playlist = youtube_api.create_playlist(boat_name)
                logger.info(f"Created new playlist for {boat_name}: {playlist['title']}")

            for video in videos:
                filename = video['name']
                video_path = video['path']
                is_before = "(Before)" in filename
                is_after = "(After)" in filename
                video_entry = {
                    'path': video_path,
                    'filename': filename,
                    'title': filename,
                    'description': '',
                    'boat_name': boat_name,
                    'playlist': playlist,
                    'is_before': is_before,
                    'is_after': is_after,
                    'size_bytes': video.get('size_bytes', 0)
                }
                upload_queue_temp.append(video_entry)
                if dry_run:
                    dry_run_report['boats'][boat_name]['video_count'] += 1
                    video_type = 'Other'
                    if is_before:
                        video_type = 'Before'
                    elif is_after:
                        video_type = 'After'
                    dry_run_report['videos'].append({
                        'title': video['name'], 
                        'size': video.get('size_mb', 0),
                        'type': video_type
                    })

        # Sort upload queue: Before videos first, After videos last, other videos in between
        upload_queue_temp.sort(key=lambda x: 0 if x['is_before'] else (2 if x['is_after'] else 1))

        if dry_run:
            # Only return the dry run report, do NOT reset upload_status or upload_queue
            total_boats = len(dry_run_report['boats'])
            total_videos = len(dry_run_report['videos'])
            existing_playlists = len(dry_run_report['playlists']['existing'])
            new_playlists = len(dry_run_report['playlists']['to_create'])
            dry_run_report['videos'].sort(key=lambda x: 0 if x['type'] == 'Before' else (2 if x['type'] == 'After' else 1))
            return jsonify({
                'success': True,
                'dry_run': True,
                'uploads': total_videos,
                'report': {
                    'summary': {
                        'total_boats': total_boats,
                        'total_videos': total_videos,
                        'existing_playlists': existing_playlists,
                        'new_playlists': new_playlists,
                        'privacy': config['youtube']['default_privacy']
                    },
                    'details': dry_run_report
                }
            })

        # Only reset state and start upload if NOT a dry run
        upload_status = {
            'active': True,
            'total': len(upload_queue_temp),
            'completed': 0,
            'failed': 0,
            'in_progress': len(upload_queue_temp),
            'complete': False,
            'recent_uploads': [],
            'cancel_requested': False,
            'current_upload': None,
            'paused': False,
            'completed_uploads': [],
            'failed_uploads': [],
            'pending_uploads': []
        }
        upload_queue = upload_queue_temp

        # Start upload thread
        upload_thread = threading.Thread(target=process_upload_queue)
        upload_thread.daemon = True
        upload_thread.start()

        return jsonify({
            'success': True,
            'uploads': len(upload_queue),
            'dry_run': False
        })
    
    except Exception as e:
        logger.exception("Error starting upload")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/upload-status')
def get_upload_status():
    """API endpoint to get the current upload status."""
    return jsonify(upload_status)

@app.route('/api/cancel-upload', methods=['POST'])
def cancel_upload():
    """API endpoint to cancel an in-progress upload."""
    global upload_status, upload_queue
    
    data = request.json or {}
    video_id = data.get('video_id')
    
    if not upload_status['active'] or upload_status['complete']:
        return jsonify({'success': False, 'message': 'No active upload to cancel'})
    
    # Handle different cancellation types
    if video_id == 'remaining':
        # Cancel all remaining uploads but let current one finish
        upload_status['cancel_requested'] = True
        logger.info("Remaining uploads cancellation requested")
        return jsonify({'success': True, 'message': 'Remaining uploads cancellation requested'})
    elif video_id:
        # Cancel a specific upload
        for i, video in enumerate(upload_queue):
            if video.get('id') == video_id:
                # Mark this video as cancelled in the queue
                upload_queue[i]['cancelled'] = True
                logger.info(f"Specific upload cancellation requested for video ID: {video_id}")
                return jsonify({'success': True, 'message': f'Cancellation requested for video ID: {video_id}'})
        return jsonify({'success': False, 'message': 'Video not found in upload queue'})
    else:
        # Cancel all uploads
        upload_status['cancel_requested'] = True
        logger.info("Upload cancellation requested")
        return jsonify({'success': True, 'message': 'Upload cancellation requested'})

@app.route('/api/clear-upload-status', methods=['POST'])
def clear_upload_status():
    """API endpoint to clear the upload status."""
    global upload_status
    
    # Only allow clearing if uploads are complete or not active
    if upload_status['active'] and not upload_status['complete']:
        return jsonify({'success': False, 'message': 'Cannot clear status while uploads are in progress'})
    
    # Reset upload status
    upload_status = {
        'active': False,
        'total': 0,
        'completed': 0,
        'failed': 0,
        'in_progress': 0,
        'complete': True,
        'recent_uploads': [],
        'cancel_requested': False,
        'current_upload': None,
        'paused': False,
        'completed_uploads': [],
        'failed_uploads': [],
        'pending_uploads': []
    }
    
    logger.info("Upload status cleared")
    return jsonify({'success': True, 'message': 'Upload status cleared'})

@app.route('/api/save-directory-settings', methods=['POST'])
def save_directory_settings():
    """API endpoint to save directory settings."""
    global config, file_ops
    
    try:
        data = request.json
        source_dir = data['source_dir']
        upload_dir = data['upload_dir']
        archive_dir = data['archive_dir']
        
        # Update config
        config['directories']['source'] = source_dir
        config['directories']['upload'] = upload_dir
        config['directories']['archive'] = archive_dir
        
        # Save to config file
        with open('config.json', 'w') as config_file:
            json.dump(config, config_file, indent=2)
        
        # Create directories if they don't exist
        os.makedirs(source_dir, exist_ok=True)
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(archive_dir, exist_ok=True)
        
        # Reinitialize file operations with new config
        file_ops = FileOperations('config.json')
        
        logger.info(f"Directory settings updated: source={source_dir}, upload={upload_dir}, archive={archive_dir}")
        
        return jsonify({'success': True})
    
    except Exception as e:
        logger.exception("Error saving directory settings")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/save-youtube-settings', methods=['POST'])
def save_youtube_settings():
    """API endpoint to save YouTube settings."""
    global config, youtube_api
    
    try:
        data = request.json
        default_privacy = data['default_privacy']
        auto_create_playlists = data['auto_create_playlists']
        
        # Validate privacy setting
        valid_privacy_settings = ['private', 'unlisted', 'public']
        if default_privacy not in valid_privacy_settings:
            return jsonify({'success': False, 'error': f"Invalid privacy setting: {default_privacy}"})
        
        # Update config
        config['youtube']['default_privacy'] = default_privacy
        config['youtube']['auto_create_playlists'] = auto_create_playlists
        
        # Save to config file
        with open('config.json', 'w') as config_file:
            json.dump(config, config_file, indent=2)
        
        # Reload YouTube API config
        youtube_api.reload_config()
        
        logger.info(f"YouTube settings updated: privacy={default_privacy}, auto_create_playlists={auto_create_playlists}")
        
        return jsonify({'success': True})
    
    except Exception as e:
        logger.exception("Error saving YouTube settings")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/save-video-settings', methods=['POST'])
def save_video_settings():
    """API endpoint to save video settings."""
    global config
    
    try:
        data = request.json
        min_size_mb = float(data['min_size_mb'])
        max_size_mb = float(data['max_size_mb'])
        
        # Validate min size (must be positive)
        if min_size_mb < 0:
            return jsonify({'success': False, 'error': f"Invalid minimum size: {min_size_mb}"})
        
        # Validate max size (must be positive and greater than min)
        if max_size_mb < 0:
            return jsonify({'success': False, 'error': f"Invalid maximum size: {max_size_mb}"})
        
        if min_size_mb >= max_size_mb:
            return jsonify({'success': False, 'error': "Minimum size must be less than maximum size"})
        
        # Update config
        config['video']['min_size_mb'] = min_size_mb
        config['video']['max_size_mb'] = max_size_mb
        
        # Save to config file
        with open('config.json', 'w') as config_file:
            json.dump(config, config_file, indent=2)
        
        logger.info(f"Video settings updated: min_size_mb={min_size_mb}, max_size_mb={max_size_mb}")
        
        return jsonify({'success': True})
    
    except Exception as e:
        logger.exception("Error saving video settings")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/save-upload-settings', methods=['POST'])
def save_upload_settings():
    """API endpoint to save upload throttling settings."""
    global config, youtube_api
    
    try:
        data = request.json
        throttling_enabled = data['throttling_enabled']
        max_upload_rate_mbps = float(data['max_upload_rate_mbps'])
        
        # Validate max upload rate (must be positive)
        if max_upload_rate_mbps <= 0:
            return jsonify({'success': False, 'error': f"Invalid upload rate: {max_upload_rate_mbps}"})
        
        # Ensure upload section exists in config
        if 'upload' not in config:
            config['upload'] = {}
        
        # Update config
        config['upload']['throttling_enabled'] = throttling_enabled
        config['upload']['max_upload_rate_mbps'] = max_upload_rate_mbps
        
        # Save to config file
        with open('config.json', 'w') as config_file:
            json.dump(config, config_file, indent=2)
        
        # Reload YouTube API config to pick up new settings
        youtube_api.reload_config()
        
        logger.info(f"Upload settings updated: throttling_enabled={throttling_enabled}, max_upload_rate_mbps={max_upload_rate_mbps}")
        
        return jsonify({'success': True})
    
    except Exception as e:
        logger.exception("Error saving upload settings")
        return jsonify({'success': False, 'error': str(e)})
        
@app.route('/api/upload-source-video', methods=['POST'])
def upload_source_video():
    """API endpoint to handle file uploads to source directory."""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file part'})
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No selected file'})
            
        # Check if the file is a video
        _, ext = os.path.splitext(file.filename)
        video_extensions = ['.mp4', '.mov', '.avi', '.wmv']
        
        if ext.lower() not in video_extensions:
            return jsonify({'success': False, 'error': f'File type {ext} not supported. Only video files are allowed.'})
        
        # Get the content length if available
        content_length = request.content_length
        if content_length is None:
            logger.warning(f"Content length not available for {file.filename}")
        
        # Save the file to the source directory with progress tracking
        file_path = os.path.join(config['directories']['source'], file.filename)
        
        # Check if file already exists
        if os.path.exists(file_path):
            logger.warning(f"File {file.filename} already exists in source directory")
            return jsonify({
                'success': False, 
                'error': 'File already exists in source directory',
                'file': {
                    'name': file.filename,
                    'path': file_path,
                    'size_mb': round(os.path.getsize(file_path) / (1024 * 1024), 2),
                    'created': os.path.getctime(file_path)
                }
            })
        
        # Save file with progress tracking
        chunk_size = 8192  # 8KB chunks
        bytes_transferred = 0
        start_time = time.time()
        
        with open(file_path, 'wb') as f:
            while True:
                chunk = file.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                bytes_transferred += len(chunk)
                
                # Log progress every ~10% if content length is available
                if content_length:
                    progress = (bytes_transferred / content_length) * 100
                    if progress % 10 < (chunk_size / content_length) * 100:
                        logger.info(f"Transfer progress for {file.filename}: {progress:.1f}%")
        
        # Calculate transfer statistics
        end_time = time.time()
        transfer_time = end_time - start_time
        file_size_bytes = os.path.getsize(file_path)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
        transfer_speed_mbps = round((file_size_bytes / transfer_time) / (1024 * 1024), 2)
        
        # Log detailed transfer information
        logger.info(f"Completed transfer of {file.filename}:")
        logger.info(f"  - Size: {file_size_mb} MB")
        logger.info(f"  - Time: {transfer_time:.2f} seconds")
        logger.info(f"  - Speed: {transfer_speed_mbps} MB/s")
        
        return jsonify({
            'success': True, 
            'file': {
                'name': file.filename,
                'path': file_path,
                'size_mb': file_size_mb,
                'created': os.path.getctime(file_path),
                'transfer_stats': {
                    'time_seconds': round(transfer_time, 2),
                    'speed_mbps': transfer_speed_mbps
                }
            }
        })
    
    except Exception as e:
        logger.exception(f"Error uploading source video: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/delete-source-video', methods=['POST'])
def delete_source_video():
    """API endpoint to delete a source video."""
    try:
        data = request.json
        file_path = data['file_path']
        
        result = file_ops.delete_source_video(file_path)
        
        if result['success']:
            logger.info(f"Deleted source video: {result['file']}")
        else:
            logger.error(f"Error deleting source video: {result['error']}")
            
        return jsonify(result)
    
    except Exception as e:
        logger.exception("Error deleting source video")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/undo-delete-video', methods=['POST'])
def undo_delete_video():
    """API endpoint to undo a source video deletion."""
    try:
        data = request.json
        filename = data['filename']
        
        result = file_ops.undo_delete_video(filename)
        
        if result['success']:
            logger.info(f"Restored deleted video: {result['file']}")
        else:
            logger.error(f"Error restoring video: {result['error']}")
            
        return jsonify(result)
    
    except Exception as e:
        logger.exception("Error restoring deleted video")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get-deleted-videos')
def get_deleted_videos():
    """API endpoint to get list of recently deleted videos."""
    try:
        deleted_videos = file_ops.get_deleted_videos()
        return jsonify({'success': True, 'videos': deleted_videos})
    
    except Exception as e:
        logger.exception("Error getting deleted videos")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/open-folder', methods=['POST'])
def open_folder():
    """API endpoint to open a folder in the system file explorer."""
    try:
        data = request.json
        folder_path = data["folder_path"]
        # Expand ~ to home directory
        folder_path = os.path.expanduser(folder_path)
        # Validate the folder path is one of our configured paths or Downloads
        valid_paths = [
            os.path.abspath(config["directories"]["source"]),
            os.path.abspath(config["directories"]["upload"]),
            os.path.abspath(config["directories"]["archive"]),
            os.path.join(os.path.expanduser("~"), "Downloads")
        ]
        folder_path = os.path.abspath(folder_path)
        if folder_path not in valid_paths:
            return jsonify({"success": False, "error": "Invalid folder path"})
        # Open the folder using the appropriate command for the OS
        if sys.platform == "darwin":
            subprocess.run(["open", folder_path])
        elif sys.platform == "win32":
            subprocess.run(["explorer", folder_path])
        else:
            subprocess.run(["xdg-open", folder_path])
        return jsonify({"success": True})
    except Exception as e:
        logger.exception("Error opening folder")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/youtube-auth-status')
def youtube_auth_status():
    """Check YouTube authentication status."""
    try:
        # Check if we have valid credentials
        if youtube_api.credentials and youtube_api.credentials.valid:
            return jsonify({'authenticated': True})
        else:
            return jsonify({'authenticated': False})
    except Exception as e:
        logger.error(f"Error checking auth status: {e}")
        return jsonify({'authenticated': False, 'error': str(e)})

@app.route('/api/youtube-auth-url')
def youtube_auth_url():
    """Get YouTube authentication URL for manual authorization."""
    try:
        # Import required modules for OAuth flow
        import google_auth_oauthlib.flow
        
        # Create OAuth flow
        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
            youtube_api.client_secrets_file, youtube_api.scopes)
        
        # Set redirect URI to handle the callback
        flow.redirect_uri = request.url_root.rstrip('/') + '/api/youtube-auth-callback'
        
        # Get authorization URL
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        # Store flow in session for callback (in production, use proper session management)
        # For now, we'll store it in the youtube_api instance
        youtube_api._pending_flow = flow
        youtube_api._pending_state = state
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'message': 'Please visit the URL to authorize the application'
        })
    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/youtube-auth-callback')
def youtube_auth_callback():
    """Handle OAuth callback from YouTube."""
    try:
        # Get authorization code from query parameters
        code = request.args.get('code')
        state = request.args.get('state')
        
        if not code:
            return jsonify({'success': False, 'error': 'No authorization code received'})
        
        # Retrieve the flow from youtube_api
        if not hasattr(youtube_api, '_pending_flow'):
            return jsonify({'success': False, 'error': 'No pending authorization flow'})
        
        flow = youtube_api._pending_flow
        
        # Exchange authorization code for credentials
        flow.fetch_token(code=code)
        
        # Save credentials
        youtube_api.credentials = flow.credentials
        with open("token.json", "w") as token_file:
            token_file.write(youtube_api.credentials.to_json())
        
        # Clean up
        delattr(youtube_api, '_pending_flow')
        if hasattr(youtube_api, '_pending_state'):
            delattr(youtube_api, '_pending_state')
        
        # Return success page
        return '''
        <html>
            <head>
                <title>YouTube Authorization Complete</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }
                    .message {
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .success { color: #28a745; }
                    .close-btn {
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h1 class="success">✓ Authorization Successful!</h1>
                    <p>You have successfully authorized BOATY to access your YouTube account.</p>
                    <p>You can now close this window and return to the application.</p>
                    <button class="close-btn" onclick="window.close()">Close Window</button>
                </div>
                <script>
                    // Try to notify the parent window
                    if (window.opener) {
                        window.opener.postMessage('youtube-auth-success', '*');
                    }
                    // Auto-close after 5 seconds
                    setTimeout(() => window.close(), 5000);
                </script>
            </body>
        </html>
        '''
    except Exception as e:
        logger.error(f"Error in auth callback: {e}")
        return f'''
        <html>
            <head>
                <title>Authorization Error</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f0f0;
                    }}
                    .message {{
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }}
                    .error {{ color: #dc3545; }}
                </style>
            </head>
            <body>
                <div class="message">
                    <h1 class="error">✗ Authorization Failed</h1>
                    <p>Error: {str(e)}</p>
                    <p>Please close this window and try again.</p>
                </div>
            </body>
        </html>
        '''

@app.route('/api/pause-upload', methods=['POST'])
def pause_upload():
    """API endpoint to pause the current upload."""
    global upload_status
    if not upload_status['active'] or upload_status['complete']:
        return jsonify({'success': False, 'message': 'No active upload to pause'})
    upload_status['paused'] = True
    logger.info("Upload paused by user")
    return jsonify({'success': True, 'message': 'Upload paused'})

@app.route('/api/resume-upload', methods=['POST'])
def resume_upload():
    """API endpoint to resume a paused upload."""
    global upload_status
    if not upload_status['active'] or upload_status['complete']:
        return jsonify({'success': False, 'message': 'No active upload to resume'})
    upload_status['paused'] = False
    logger.info("Upload resumed by user")
    return jsonify({'success': True, 'message': 'Upload resumed'})

def process_upload_queue():
    """Process the upload queue in a separate thread."""
    global upload_status
    
    logger.info(f"Starting upload process for {len(upload_queue)} videos")
    
    # Initialize tracking arrays
    upload_status['completed_uploads'] = []
    upload_status['failed_uploads'] = []
    upload_status['pending_uploads'] = []
    
    # Assign IDs to each video in the queue for individual cancellation
    for i, video_info in enumerate(upload_queue):
        video_info['id'] = f"video_{i}"
        video_info['status'] = 'pending'
        video_info['cancelled'] = False
        # Add to pending uploads
        upload_status['pending_uploads'].append(video_info['id'])
    
    with app.app_context(): # Need app context for background thread
        # Initialize video counter for the batch
        video_counter = 0
        
        # Get total number of videos for this batch
        total_videos_in_batch = len(upload_queue)
        
        # --- ADDED: Callback for progress reporting ---
        start_time = None
        
        def update_progress_callback(progress_fraction, total_size_bytes, bytes_uploaded):
            nonlocal start_time
            if not start_time: return # Don't calculate if start_time not set
            
            progress_percent = int(progress_fraction * 100)
            elapsed_time = time.time() - start_time
            speed_bps = (bytes_uploaded / elapsed_time) if elapsed_time > 0 else 0
            speed_mbps = (speed_bps * 8) / (1024 * 1024)
            bytes_remaining = total_size_bytes - bytes_uploaded
            eta_seconds = (bytes_remaining / speed_bps) if speed_bps > 0 else float('inf')
            
            # Update the specific fields in current_upload status
            if upload_status['current_upload']:
                upload_status['current_upload']['progress'] = progress_percent
                upload_status['current_upload']['speed_mbps'] = speed_mbps
                upload_status['current_upload']['eta_seconds'] = eta_seconds
                # Log the update
                logger.debug(
                    f"[ProgressCallback] Video: {upload_status['current_upload'].get('title', 'N/A')}, " \
                    f"Progress: {progress_percent}%, Speed: {speed_mbps:.2f} Mbps, ETA: {eta_seconds:.2f}s, " \
                    f"Bytes Uploaded: {bytes_uploaded}/{total_size_bytes}"
                )
        # --- END ADDED ---

        # --- ADDED: Pause check function ---
        def is_paused():
            return upload_status['paused']
        # --- END ADDED ---
        
        while upload_queue:
            video_info = upload_queue.pop(0)
            video_id = video_info['filename'] # Use filename as ID
            
            # Check for cancellation
            if upload_status['cancel_requested']:
                logger.info("Upload cancelled by user.")
                upload_status['failed'] += 1
                upload_status['failed_uploads'].append(video_id)
                if video_id in upload_status['pending_uploads']:
                    upload_status['pending_uploads'].remove(video_id)
                continue # Skip to next video if cancelled
            
            # --- ADDED: Pause handling ---
            while upload_status['paused']:
                logger.info("Upload process paused. Waiting...")
                # Update status to indicate paused state
                if upload_status['current_upload']:
                     upload_status['current_upload']['status'] = 'paused'
                time.sleep(1)
            # --- END ADDED ---

            logger.info(f"Starting upload for: {video_info['title']}")
            start_time = time.time() # Reset start time for this video
            
            # Update overall status
            upload_status['in_progress'] += 1
            upload_status['current_upload'] = {
                'id': video_id,
                'title': video_info['title'],
                'progress': 0,
                'status': 'uploading',
                'speed_mbps': 0,
                'eta_seconds': float('inf')
            }
            if video_id in upload_status['pending_uploads']:
                 upload_status['pending_uploads'].remove(video_id)
            
            try:
                # Upload the video
                result = youtube_api.upload_video(
                    video_path=video_info['path'],
                    title=video_info['title'],
                    description=video_info['description'],
                    privacy=config['youtube']['default_privacy'],
                    progress_callback=update_progress_callback, # Pass the callback
                    pause_check=is_paused # Pass the pause check
                )
                
                if result['success']:
                    video_id = result['video_id']
                    logger.info(f"Uploaded video: {video_info['title']} -> {video_id}")
                    
                    # Add to completed uploads
                    upload_status['completed_uploads'].append(video_info['id'])
                    
                    # Add to playlist if available
                    if video_info['playlist']:
                        playlist_result = youtube_api.add_to_playlist(
                            video_id,
                            video_info['playlist']['id']
                        )
                        
                        if playlist_result['success']:
                            logger.info(f"Added video {video_id} to playlist: {video_info['playlist']['title']}")
                            operation_logger.log_playlist(
                                video_id,
                                video_info['playlist']['id'],
                                video_info['playlist']['title']
                            )
                        else:
                            logger.error(f"Failed to add video to playlist: {playlist_result.get('error', 'Unknown error')}")
                    
                    # Move to archive
                    archive_path = file_ops.archive_video(video_info['path'])
                    logger.info(f"Archived video: {video_info['path']} -> {archive_path}")
                    
                    # Find and delete the source file
                    source_filename = os.path.basename(video_info['path'])
                    source_path = os.path.join(config['directories']['source'], source_filename)
                    if os.path.exists(source_path):
                        try:
                            os.remove(source_path)
                            logger.info(f"Deleted source video: {source_path}")
                        except Exception as e:
                            logger.error(f"Failed to delete source video {source_path}: {str(e)}")
                    
                    # Log the upload
                    operation_logger.log_upload(
                        video_info['path'],
                        video_id,
                        video_info['title']
                    )
                    
                    # Update status
                    upload_status['completed'] += 1
                    upload_status['recent_uploads'].append({
                        'title': video_info['title'],
                        'success': True,
                        'type': "Before" if video_info.get('is_before') else ("After" if video_info.get('is_after') else "Other"),
                        'status': 'completed',
                        'id': video_info['id']
                    })
                else:
                    logger.error(f"Failed to upload video: {video_info['title']}")
                    upload_status['failed'] += 1
                    upload_status['failed_uploads'].append(video_info['id'])
                    upload_status['recent_uploads'].append({
                        'title': video_info['title'],
                        'success': False,
                        'type': "Before" if video_info.get('is_before') else ("After" if video_info.get('is_after') else "Other"),
                        'status': 'failed',
                        'id': video_info['id']
                    })
            
            except Exception as e:
                logger.exception(f"Error processing video: {video_info['title']}")
                upload_status['failed'] += 1
                upload_status['failed_uploads'].append(video_info['id'])
                upload_status['recent_uploads'].append({
                    'title': video_info['title'],
                    'success': False,
                    'type': "Before" if video_info.get('is_before') else ("After" if video_info.get('is_after') else "Other"),
                    'status': 'failed',
                    'id': video_info['id']
                })
            
            finally:
                upload_status['in_progress'] -= 1
                # Update status to completed
                video_info['status'] = 'completed'
            
            # Reset current upload info
            upload_status['current_upload'] = None
            
            # Short delay between uploads
            time.sleep(1)

    # Reset cancellation flag
    upload_status['cancel_requested'] = False
    
    # Mark upload as complete
    upload_status['complete'] = True
    logger.info(f"Upload process completed. Successful: {upload_status['completed']}, Failed: {upload_status['failed']}")

if __name__ == '__main__':
    # Use port 8080 to avoid conflict with macOS AirPlay (port 5000)
    app.run(debug=True, port=8080)
