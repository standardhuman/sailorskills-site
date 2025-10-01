import os
import logging
import datetime

def setup_logging(log_dir='logs'):
    # Use absolute path for logs directory within the application
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_dir = os.path.join(current_dir, 'logs')
    """Set up logging configuration."""
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    # Set up file handler
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"boaty_{timestamp}.log")
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger('boaty')

class OperationLogger:
    """Class for logging operations and providing status updates."""
    
    def __init__(self):
        self.logger = logging.getLogger('boaty')
        self.operations = []
    
    def log_rename(self, source, destination, success=True, error=None):
        """Log a rename operation."""
        operation = {
            'type': 'rename',
            'timestamp': datetime.datetime.now().isoformat(),
            'source': source,
            'destination': destination,
            'success': success
        }
        
        if error:
            operation['error'] = str(error)
            self.logger.error(f"Rename failed: {source} -> {destination}: {error}")
        else:
            self.logger.info(f"Renamed: {source} -> {destination}")
        
        self.operations.append(operation)
        return operation
    
    def log_upload(self, video_path, video_id, title, success=True, error=None):
        """Log an upload operation."""
        operation = {
            'type': 'upload',
            'timestamp': datetime.datetime.now().isoformat(),
            'video_path': video_path,
            'video_id': video_id,
            'title': title,
            'success': success
        }
        
        if error:
            operation['error'] = str(error)
            self.logger.error(f"Upload failed: {video_path} ({title}): {error}")
        else:
            self.logger.info(f"Uploaded: {video_path} -> YouTube ID: {video_id}")
        
        self.operations.append(operation)
        return operation
    
    def log_playlist(self, video_id, playlist_id, playlist_title, success=True, error=None):
        """Log a playlist addition operation."""
        operation = {
            'type': 'playlist',
            'timestamp': datetime.datetime.now().isoformat(),
            'video_id': video_id,
            'playlist_id': playlist_id,
            'playlist_title': playlist_title,
            'success': success
        }
        
        if error:
            operation['error'] = str(error)
            self.logger.error(f"Playlist addition failed: {video_id} -> {playlist_title}: {error}")
        else:
            self.logger.info(f"Added to playlist: Video {video_id} -> {playlist_title}")
        
        self.operations.append(operation)
        return operation
    
    def log_archive(self, source, destination, success=True, error=None):
        """Log an archive operation."""
        operation = {
            'type': 'archive',
            'timestamp': datetime.datetime.now().isoformat(),
            'source': source,
            'destination': destination,
            'success': success
        }
        
        if error:
            operation['error'] = str(error)
            self.logger.error(f"Archive failed: {source} -> {destination}: {error}")
        else:
            self.logger.info(f"Archived: {source} -> {destination}")
        
        self.operations.append(operation)
        return operation
    
    def get_recent_operations(self, operation_type=None, limit=10):
        """Get recent operations of a specific type."""
        if operation_type:
            filtered_ops = [op for op in self.operations if op['type'] == operation_type]
        else:
            filtered_ops = self.operations
        
        return filtered_ops[-limit:] if limit else filtered_ops