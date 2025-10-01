#!/usr/bin/env python3
"""
Create dummy test video files for testing BOATY rename preview functionality.
"""

import os
import sys

def create_test_videos(source_dir, count=6):
    """Create dummy .mp4 files for testing."""
    
    if not os.path.exists(source_dir):
        os.makedirs(source_dir)
        print(f"Created directory: {source_dir}")
    
    # Create test video files
    test_files = [
        "DJI_0001.mp4",
        "DJI_0002.mp4", 
        "DJI_0003.mp4",
        "DJI_0004.mp4",
        "DJI_0005.mp4",
        "DJI_0006.mp4",
        "VID_20240715_093045.mp4",
        "IMG_1234.MOV",
        "test_video.MP4"
    ]
    
    created = 0
    for filename in test_files[:count]:
        filepath = os.path.join(source_dir, filename)
        if not os.path.exists(filepath):
            # Create a small dummy file (1MB)
            with open(filepath, 'wb') as f:
                f.write(b'\x00' * (1024 * 1024))  # 1MB of zeros
            print(f"Created test video: {filename}")
            created += 1
        else:
            print(f"File already exists: {filename}")
    
    print(f"\nCreated {created} test video files in {source_dir}")
    return created

if __name__ == "__main__":
    # Get source directory from config
    import json
    
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
        source_dir = config['directories']['source']
    else:
        source_dir = "/Users/brian/Downloads/*BOATY Video Files/source"
    
    # Create test videos
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    create_test_videos(source_dir, count)