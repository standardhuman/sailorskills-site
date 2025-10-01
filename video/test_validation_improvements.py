#!/usr/bin/env python3
"""
Test script for validation improvements in BOATY rename preview
"""

import requests
import json

BASE_URL = "http://localhost:8080"

def test_empty_boat_names():
    """Test validation for empty boat names"""
    print("\n=== Testing Empty Boat Names ===")
    
    # Test with empty array
    response = requests.post(f"{BASE_URL}/api/preview-rename", json={
        "boat_names": [],
        "selected_date": "2025-03-25",
        "videos_per_boat": 2
    })
    data = response.json()
    print(f"Empty array test: {data}")
    assert not data['success']
    assert 'at least one boat name' in data['error'].lower()
    
    # Test with whitespace-only names
    response = requests.post(f"{BASE_URL}/api/preview-rename", json={
        "boat_names": ["", "  ", "\t", "\n"],
        "selected_date": "2025-03-25",
        "videos_per_boat": 2
    })
    data = response.json()
    print(f"Whitespace names test: {data}")
    assert not data['success']
    assert 'at least one boat name' in data['error'].lower()

def test_special_characters():
    """Test filename sanitization for special characters"""
    print("\n=== Testing Special Character Sanitization ===")
    
    # Test with various special characters
    response = requests.post(f"{BASE_URL}/api/preview-rename", json={
        "boat_names": [
            "Boat/Name",
            "Boat\\Name",
            "Boat:Name",
            "Boat*Name",
            "Boat?Name",
            "Boat<Name>",
            "Boat|Name",
            "Boat\"Name\""
        ],
        "selected_date": "2025-03-25",
        "videos_per_boat": 1
    })
    data = response.json()
    
    if data['success']:
        print("Special characters test successful")
        for assignment in data['assignments']:
            print(f"  Original: {assignment['boat_name']} -> Preview: {assignment['preview_name']}")
            # Check that special characters are replaced
            assert '/' not in assignment['preview_name']
            assert '\\' not in assignment['preview_name']
            assert ':' not in assignment['preview_name']
            assert '*' not in assignment['preview_name']
            assert '?' not in assignment['preview_name']
            assert '<' not in assignment['preview_name']
            assert '>' not in assignment['preview_name']
            assert '|' not in assignment['preview_name']
            assert '"' not in assignment['preview_name']
    else:
        print(f"Error: {data['error']}")

def test_date_validation():
    """Test date validation"""
    print("\n=== Testing Date Validation ===")
    
    # Test with missing date
    response = requests.post(f"{BASE_URL}/api/preview-rename", json={
        "boat_names": ["Test Boat"],
        "selected_date": "",
        "videos_per_boat": 2
    })
    data = response.json()
    print(f"Missing date test: {data}")
    assert not data['success']
    assert 'date' in data['error'].lower()
    
    # Test with invalid date format
    response = requests.post(f"{BASE_URL}/api/preview-rename", json={
        "boat_names": ["Test Boat"],
        "selected_date": "25-03-2025",  # Wrong format
        "videos_per_boat": 2
    })
    data = response.json()
    print(f"Invalid date format test: {data}")
    assert not data['success']
    assert 'date format' in data['error'].lower()

def test_apply_rename_validation():
    """Test validation when applying rename"""
    print("\n=== Testing Apply Rename Validation ===")
    
    # Test with assignment missing boat name
    response = requests.post(f"{BASE_URL}/api/rename-videos", json={
        "assignments": [
            {
                "source_path": "/path/to/video1.mp4",
                "boat_name": "",  # Empty boat name
                "date": "2025-03-25",
                "type": "Before",
                "position": 1
            }
        ]
    })
    data = response.json()
    print(f"Empty boat name in assignment: Success={data['success']}, Renamed={data.get('renamed', 0)}")
    # Should succeed but skip the video with empty boat name
    assert data['success']
    assert data['renamed'] == 0

def main():
    """Run all tests"""
    print("Starting validation improvement tests...")
    
    try:
        # Test connection
        response = requests.get(BASE_URL)
        if response.status_code != 200:
            print(f"Error: Cannot connect to BOATY at {BASE_URL}")
            return
        
        test_empty_boat_names()
        test_special_characters()
        test_date_validation()
        test_apply_rename_validation()
        
        print("\n✅ All validation tests passed!")
        
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to BOATY at {BASE_URL}. Make sure the app is running.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()