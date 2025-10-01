#!/usr/bin/env python3
"""
Comprehensive test script for BOATY rename preview functionality.
This script tests all the scenarios mentioned without requiring external tools like Playwright.
"""

import sys
import time
import json
import subprocess
import requests
from datetime import datetime
import os
import signal

# Configuration
BASE_URL = "http://localhost:8080"
API_BASE = f"{BASE_URL}/api"

# Global variable to store the app process
app_process = None

def start_app():
    """Start the BOATY application."""
    global app_process
    print("Starting BOATY application...")
    
    # Check if virtual environment exists
    venv_path = os.path.join(os.path.dirname(__file__), 'boaty_venv_new')
    if not os.path.exists(venv_path):
        print("Error: Virtual environment not found at", venv_path)
        return False
    
    # Activate virtual environment and run app
    python_path = os.path.join(venv_path, 'bin', 'python')
    if not os.path.exists(python_path):
        # Try Windows path
        python_path = os.path.join(venv_path, 'Scripts', 'python.exe')
    
    try:
        app_process = subprocess.Popen(
            [python_path, 'app.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(__file__)
        )
        
        # Wait for app to start
        time.sleep(3)
        
        # Check if app is running
        try:
            response = requests.get(BASE_URL, timeout=5)
            if response.status_code == 200:
                print("✓ BOATY application started successfully")
                return True
        except:
            pass
        
        print("✗ Failed to start BOATY application")
        if app_process:
            stdout, stderr = app_process.communicate(timeout=1)
            print("STDOUT:", stdout.decode())
            print("STDERR:", stderr.decode())
        return False
        
    except Exception as e:
        print(f"Error starting app: {e}")
        return False

def stop_app():
    """Stop the BOATY application."""
    global app_process
    if app_process:
        print("\nStopping BOATY application...")
        app_process.terminate()
        try:
            app_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            app_process.kill()
        print("✓ BOATY application stopped")

def test_api_endpoint(endpoint, method='GET', data=None, expected_status=200):
    """Test an API endpoint."""
    url = f"{API_BASE}/{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        return None

def print_test_header(test_name):
    """Print a formatted test header."""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")

def print_result(success, message):
    """Print test result with formatting."""
    if success:
        print(f"✓ {message}")
    else:
        print(f"✗ {message}")

def test_basic_rename_preview():
    """Test 1: Basic rename preview flow"""
    print_test_header("Basic Rename Preview Flow")
    
    # Check if source videos are loaded
    response = test_api_endpoint('source-videos')
    if response and response.status_code == 200:
        data = response.json()
        video_count = len(data.get('videos', []))
        print_result(True, f"Source videos loaded: {video_count} videos found")
        
        if video_count == 0:
            print_result(False, "No source videos available for testing")
            return False
    else:
        print_result(False, "Failed to load source videos")
        return False
    
    # Test preview rename endpoint
    test_data = {
        'boat_names': ['Test Boat A', 'Test Boat B', 'Test Boat C'],
        'selected_date': datetime.now().strftime('%Y-%m-%d'),
        'videos_per_boat': 2
    }
    
    response = test_api_endpoint('preview-rename', method='POST', data=test_data)
    if response and response.status_code == 200:
        data = response.json()
        if data.get('success'):
            assignments = data.get('assignments', [])
            print_result(True, f"Preview generated successfully: {len(assignments)} assignments")
            
            # Verify assignments structure
            if assignments:
                first = assignments[0]
                required_fields = ['index', 'source_name', 'boat_name', 'date', 'type', 'preview_name']
                has_all_fields = all(field in first for field in required_fields)
                print_result(has_all_fields, f"Assignment structure is valid")
                
                # Check preview names
                for assignment in assignments[:3]:
                    print(f"  - {assignment['source_name']} → {assignment['preview_name']}")
            
            # Check unassigned videos
            unassigned = data.get('unassigned', [])
            if unassigned:
                print_result(True, f"Unassigned videos detected: {len(unassigned)} videos")
            
            return True
        else:
            print_result(False, f"Preview generation failed: {data.get('error', 'Unknown error')}")
    else:
        print_result(False, "Failed to call preview-rename endpoint")
    
    return False

def test_empty_boat_names():
    """Test 5a: Edge case - Empty boat names"""
    print_test_header("Edge Case: Empty Boat Names")
    
    test_data = {
        'boat_names': [],
        'selected_date': datetime.now().strftime('%Y-%m-%d'),
        'videos_per_boat': 2
    }
    
    response = test_api_endpoint('preview-rename', method='POST', data=test_data)
    if response:
        data = response.json()
        success = not data.get('success', True)  # Should fail
        print_result(success, "Empty boat names properly rejected")
        if 'error' in data:
            print(f"  Error message: {data['error']}")
        return success
    
    return False

def test_no_source_videos():
    """Test 5b: Edge case - No source videos"""
    print_test_header("Edge Case: No Source Videos")
    
    # This test would require clearing source videos first
    # For now, we'll just check the current state
    response = test_api_endpoint('source-videos')
    if response and response.status_code == 200:
        data = response.json()
        video_count = len(data.get('videos', []))
        if video_count == 0:
            # Try preview rename with no videos
            test_data = {
                'boat_names': ['Test Boat'],
                'selected_date': datetime.now().strftime('%Y-%m-%d'),
                'videos_per_boat': 2
            }
            
            response = test_api_endpoint('preview-rename', method='POST', data=test_data)
            if response:
                data = response.json()
                success = not data.get('success', True)  # Should fail
                print_result(success, "No source videos properly handled")
                return success
        else:
            print_result(None, f"Cannot test - {video_count} source videos present")
    
    return False

def test_more_videos_than_boats():
    """Test 5c: Edge case - More videos than boat names"""
    print_test_header("Edge Case: More Videos Than Boat Names")
    
    # First get video count
    response = test_api_endpoint('source-videos')
    if response and response.status_code == 200:
        data = response.json()
        video_count = len(data.get('videos', []))
        
        if video_count > 2:
            # Use only one boat name
            test_data = {
                'boat_names': ['Single Boat'],
                'selected_date': datetime.now().strftime('%Y-%m-%d'),
                'videos_per_boat': 2
            }
            
            response = test_api_endpoint('preview-rename', method='POST', data=test_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    assignments = data.get('assignments', [])
                    unassigned = data.get('unassigned', [])
                    
                    print_result(True, f"Preview handled excess videos:")
                    print(f"  - Assignments: {len(assignments)}")
                    print(f"  - Unassigned: {len(unassigned)}")
                    print(f"  - Total videos: {video_count}")
                    
                    return len(unassigned) > 0  # Should have unassigned videos
    
    return False

def test_special_characters():
    """Test 5d: Edge case - Special characters in boat names"""
    print_test_header("Edge Case: Special Characters in Boat Names")
    
    test_data = {
        'boat_names': [
            'Boat/Name',
            'Boat\\Name',
            'Boat:Name',
            'Boat*Name',
            'Boat?Name',
            'Boat"Name',
            'Boat<Name>',
            'Boat|Name',
            'Boat.Name',
            'Boat Name with Spaces'
        ],
        'selected_date': datetime.now().strftime('%Y-%m-%d'),
        'videos_per_boat': 1
    }
    
    response = test_api_endpoint('preview-rename', method='POST', data=test_data)
    if response and response.status_code == 200:
        data = response.json()
        if data.get('success'):
            assignments = data.get('assignments', [])
            print_result(True, f"Special characters handled: {len(assignments)} assignments")
            
            # Check how special characters were handled in preview names
            for assignment in assignments[:5]:
                original = assignment.get('boat_name', '')
                preview = assignment.get('preview_name', '')
                print(f"  - '{original}' → '{preview}'")
            
            return True
    
    return False

def test_quick_rename_vs_preview():
    """Test 4: Quick rename vs Preview rename functionality"""
    print_test_header("Quick Rename vs Preview Rename")
    
    # This test would verify that both buttons exist and work differently
    # For API testing, we can verify the endpoints exist
    
    # Test that preview endpoint exists
    test_data = {
        'boat_names': ['Quick Test'],
        'selected_date': datetime.now().strftime('%Y-%m-%d'),
        'videos_per_boat': 2
    }
    
    preview_response = test_api_endpoint('preview-rename', method='POST', data=test_data)
    preview_works = preview_response and preview_response.status_code == 200
    print_result(preview_works, "Preview rename endpoint works")
    
    # Test that direct rename endpoint exists
    rename_response = test_api_endpoint('rename-videos', method='POST', data=test_data)
    rename_works = rename_response and rename_response.status_code in [200, 400, 422]  # Any response shows it exists
    print_result(rename_works, "Quick rename endpoint exists")
    
    return preview_works

def test_rename_with_assignments():
    """Test applying rename with custom assignments"""
    print_test_header("Apply Rename with Custom Assignments")
    
    # First generate a preview
    test_data = {
        'boat_names': ['Custom Boat A', 'Custom Boat B'],
        'selected_date': datetime.now().strftime('%Y-%m-%d'),
        'videos_per_boat': 2
    }
    
    response = test_api_endpoint('preview-rename', method='POST', data=test_data)
    if response and response.status_code == 200:
        data = response.json()
        if data.get('success'):
            assignments = data.get('assignments', [])
            
            # Modify some assignments
            if assignments:
                # Change first assignment
                assignments[0]['boat_name'] = 'Modified Boat Name'
                assignments[0]['type'] = 'Inspection'
                
                # Test rename with assignments
                rename_data = {
                    'assignments': assignments
                }
                
                response = test_api_endpoint('rename-videos', method='POST', data=rename_data)
                if response:
                    data = response.json()
                    if response.status_code == 200 and data.get('success'):
                        print_result(True, f"Rename with assignments successful: {data.get('renamed', 0)} videos renamed")
                        return True
                    else:
                        print_result(False, f"Rename failed: {data.get('error', 'Unknown error')}")
    
    return False

def test_api_integration():
    """Test overall API integration and workflow"""
    print_test_header("API Integration Tests")
    
    endpoints = [
        ('source-videos', 'GET'),
        ('upload-ready-videos', 'GET'),
        ('youtube-auth-status', 'GET'),
        ('get-deleted-videos', 'GET')
    ]
    
    all_success = True
    for endpoint, method in endpoints:
        response = test_api_endpoint(endpoint, method=method)
        success = response and response.status_code == 200
        print_result(success, f"{endpoint} ({method})")
        all_success = all_success and success
    
    return all_success

def run_all_tests():
    """Run all test scenarios."""
    print("\n" + "="*60)
    print("BOATY RENAME PREVIEW FUNCTIONALITY TEST SUITE")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if app is running
    try:
        response = requests.get(BASE_URL, timeout=5)
        app_running = response.status_code == 200
    except:
        app_running = False
    
    if not app_running:
        print("\n⚠️  BOATY application is not running!")
        print("Attempting to start the application...")
        if not start_app():
            print("\n❌ Failed to start BOATY application. Please start it manually.")
            # Try once more in case it's already running
            try:
                response = requests.get(BASE_URL, timeout=5)
                app_running = response.status_code == 200
                if app_running:
                    print("✓ BOATY application is already running (detected on retry)")
                else:
                    return
            except:
                return
    else:
        print("\n✓ BOATY application is already running")
    
    # Run tests
    test_results = []
    
    tests = [
        ("Basic Rename Preview Flow", test_basic_rename_preview),
        ("Empty Boat Names", test_empty_boat_names),
        ("No Source Videos", test_no_source_videos),
        ("More Videos Than Boats", test_more_videos_than_boats),
        ("Special Characters", test_special_characters),
        ("Quick vs Preview Rename", test_quick_rename_vs_preview),
        ("Apply Custom Assignments", test_rename_with_assignments),
        ("API Integration", test_api_integration)
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            test_results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            test_results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASS" if result else "FAIL"
        symbol = "✓" if result else "✗"
        print(f"{symbol} {test_name:<40} [{status}]")
    
    print(f"\nTotal: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    """Main entry point."""
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\nTest suite interrupted by user")
    finally:
        # Clean up
        if app_process:
            stop_app()

if __name__ == "__main__":
    # Set up signal handling for clean shutdown
    def signal_handler(sig, frame):
        print('\n\nReceived interrupt signal, cleaning up...')
        if app_process:
            stop_app()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    main()