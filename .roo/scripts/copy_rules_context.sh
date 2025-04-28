#!/bin/bash

# Script to copy unique YAML files from rules directories to context directory
# Created for the Orchestrator mode to consolidate configuration files

# Ensure the destination directory exists
mkdir -p .roo/context/

echo "Copying unique YAML files from rules directories to context directory..."

# Find all .yaml files in .roo/rules-* directories and copy them to .roo/context/
# Only copy if source is newer or destination is missing
echo "Looking for .yaml files in .roo/rules-* directories..."
find .roo/rules-* -type f -name "*.yaml" -print

echo "Copying .yaml files..."
for file in $(find .roo/rules-* -type f -name "*.yaml"); do
    filename=$(basename "$file")
    dest=".roo/context/$filename"
    
    # Copy if destination doesn't exist or source is newer
    if [ ! -f "$dest" ] || [ "$file" -nt "$dest" ]; then
        echo "Copying $file to $dest"
        cp -v "$file" "$dest"
    else
        echo "Skipping $file (not newer than destination)"
    fi
done

# Also check for .yml extension (as YAML files sometimes use this extension)
echo "Looking for .yml files in .roo/rules-* directories..."
find .roo/rules-* -type f -name "*.yml" -print

echo "Copying .yml files..."
for file in $(find .roo/rules-* -type f -name "*.yml"); do
    filename=$(basename "$file")
    dest=".roo/context/$filename"
    
    # Copy if destination doesn't exist or source is newer
    if [ ! -f "$dest" ] || [ "$file" -nt "$dest" ]; then
        echo "Copying $file to $dest"
        cp -v "$file" "$dest"
    else
        echo "Skipping $file (not newer than destination)"
    fi
done

echo "Copy operation completed successfully."