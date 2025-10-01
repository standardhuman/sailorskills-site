#!/usr/bin/env python3

"""
BOATY Launcher
This script launches the BOATY application on a free port and opens a web browser
"""

import os
import sys
import socket
import webbrowser
import time
import subprocess
import signal
import atexit

# Banner
print("=========================================")
print("BOATY - Boat Video Manager & Uploader")
print("=========================================\n")

def find_free_port(start_port=8080):
    """Find a free port starting from start_port"""
    port = start_port
    max_port = start_port + 100  # Don't search forever
    
    while port < max_port:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("127.0.0.1", port))
            sock.close()
            return port
        except OSError:
            port += 1
        finally:
            sock.close()
    
    # If no port found, return a high random port
    return 8000 + (os.getpid() % 1000)

def launch_app(port):
    """Launch the Flask app on the specified port"""
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to Python in the virtual environment
    if sys.platform == 'win32':
        python_path = os.path.join(script_dir, "boaty_venv_new", "Scripts", "python.exe")
    else:
        python_path = os.path.join(script_dir, "boaty_venv_new", "bin", "python")
    
    # Check if Python exists
    if not os.path.exists(python_path):
        print(f"Error: Python not found at {python_path}")
        print("Please make sure the virtual environment is properly set up.")
        sys.exit(1)
    
    print(f"Starting BOATY application on port {port}...")
    
    # Set environment variables for Flask
    env = os.environ.copy()
    env["FLASK_APP"] = "app.py"
    env["FLASK_ENV"] = "development"
    env["FLASK_DEBUG"] = "1"
    env["FLASK_RUN_PORT"] = str(port)
    env["FLASK_RUN_HOST"] = "127.0.0.1"
    
    # Start the Flask application
    try:
        if sys.platform == 'win32':
            # Use a different approach on Windows to avoid console window
            from subprocess import CREATE_NEW_CONSOLE
            process = subprocess.Popen(
                [python_path, "-m", "flask", "run", "--port", str(port), "--host", "127.0.0.1"],
                env=env,
                cwd=script_dir,
                creationflags=CREATE_NEW_CONSOLE
            )
        else:
            process = subprocess.Popen(
                [python_path, "-m", "flask", "run", "--port", str(port), "--host", "127.0.0.1"],
                env=env,
                cwd=script_dir
            )
        
        return process
    except Exception as e:
        print(f"Error starting application: {e}")
        sys.exit(1)

def open_browser(port):
    """Open the web browser after a delay to let Flask start"""
    print("Opening web browser (Chrome)...")
    time.sleep(5)  # Wait for Flask to start (increased from 2 to 5 seconds)
    
    # Check if BROWSER environment variable is set (used by launch_boaty.command)
    browser_env = os.environ.get('BROWSER')
    if browser_env:
        # Use the environment variable to open the browser
        print(f"Using browser from environment: {browser_env}")
        os.system(f"{browser_env} 'http://localhost:{port}'")
        return
    
    # Force Chrome on different platforms
    if sys.platform == 'darwin':  # macOS
        print("Opening Chrome on macOS...")
        subprocess.run(['open', '-a', 'Google Chrome', f'http://localhost:{port}'])
    elif sys.platform == 'win32':  # Windows
        print("Opening Chrome on Windows...")
        chrome_path = 'C:/Program Files/Google/Chrome/Application/chrome.exe %s'
        try:
            webbrowser.get(chrome_path).open(f'http://localhost:{port}')
        except:
            print("Failed to open Chrome, falling back to default browser")
            webbrowser.open(f'http://localhost:{port}')
    elif sys.platform.startswith('linux'):  # Linux
        print("Opening Chrome on Linux...")
        chrome_path = '/usr/bin/google-chrome %s'
        try:
            webbrowser.get(chrome_path).open(f'http://localhost:{port}')
        except:
            print("Failed to open Chrome, falling back to default browser")
            webbrowser.open(f'http://localhost:{port}')
    else:
        # Fallback for other platforms
        print("Unknown platform, using default browser")
        webbrowser.open(f'http://localhost:{port}')

def cleanup(process):
    """Clean up function to stop the server when this script exits"""
    if process:
        try:
            if sys.platform == 'win32':
                process.terminate()
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except:
            pass

def main():
    # Find a free port
    port = find_free_port()
    
    # Launch the application
    app_process = launch_app(port)
    
    # Register cleanup function
    atexit.register(cleanup, app_process)
    
    # Open browser
    open_browser(port)
    
    print(f"\nBOATY is running at: http://localhost:{port}")
    print("Press Ctrl+C to stop the application when you're done.")
    
    try:
        # Keep the script running
        while app_process.poll() is None:
            time.sleep(1)
        
        # If we get here, the process has ended
        print("Application has stopped.")
    except KeyboardInterrupt:
        print("\nStopping BOATY application...")
        cleanup(app_process)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
