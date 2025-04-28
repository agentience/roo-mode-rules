#!/bin/bash

# Script to copy the .roo directory to a target directory
# Usage: ./copy_roo.sh <target_directory>

# Check if target directory argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Target directory not specified."
    echo "Usage: ./copy_roo.sh <target_directory>"
    exit 1
fi

TARGET_DIR="$1"

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Target directory '$TARGET_DIR' does not exist."
    echo "Please provide a valid directory path."
    exit 1
fi

# Check if .roo directory exists in current directory
if [ ! -d ".roo" ]; then
    echo "Error: .roo directory not found in the current directory."
    exit 1
fi

# Copy the .roo directory to the target directory
echo "Copying .roo directory to $TARGET_DIR..."
cp -r .roo "$TARGET_DIR"

# Check if copy was successful
if [ $? -eq 0 ]; then
    echo "Successfully copied .roo directory to $TARGET_DIR"
    exit 0
else
    echo "Failed to copy .roo directory to $TARGET_DIR"
    exit 1
fi