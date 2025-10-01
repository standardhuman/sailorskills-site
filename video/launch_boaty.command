#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the app directory
cd "$DIR"

# Use full path to Python in virtual environment
PYTHON_PATH="$DIR/boaty_venv_new/bin/python"

# Check if Python exists
if [ ! -f "$PYTHON_PATH" ]; then
    echo "Error: Python executable not found at $PYTHON_PATH"
    echo "Please ensure you've set up the virtual environment properly."
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

# Set environment variable to force Chrome
export BROWSER="open -a 'Google Chrome'"

# Run the Python launcher script
"$PYTHON_PATH" "$DIR/launcher.py"
