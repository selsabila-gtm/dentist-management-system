#!/usr/bin/env python3
"""
Script to move uploaded files from wrong location to correct location
Run this after fixing app.py
"""

import os
import shutil

# Current project structure
PROJECT_ROOT = r"C:\Users\Dell\Documents\dentist-management-system\dentist-management-system"
WRONG_UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "backend", "backend", "uploads")
CORRECT_UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "backend", "uploads")

def fix_uploads():
    print("🔧 Fixing upload folder...")
    print(f"Wrong location: {WRONG_UPLOAD_FOLDER}")
    print(f"Correct location: {CORRECT_UPLOAD_FOLDER}")
    
    # Create correct folder if it doesn't exist
    os.makedirs(CORRECT_UPLOAD_FOLDER, exist_ok=True)
    
    # Check if wrong folder exists
    if os.path.exists(WRONG_UPLOAD_FOLDER):
        print(f"\n📂 Found files in wrong location:")
        
        files = os.listdir(WRONG_UPLOAD_FOLDER)
        print(f"Files to move: {len(files)}")
        
        for filename in files:
            src = os.path.join(WRONG_UPLOAD_FOLDER, filename)
            dst = os.path.join(CORRECT_UPLOAD_FOLDER, filename)
            
            if os.path.isfile(src):
                print(f"  Moving: {filename}")
                shutil.copy2(src, dst)  # Copy with metadata
                
        print(f"\n✅ Moved {len(files)} files to correct location")
        
        # Verify
        print(f"\n🔍 Verifying correct location:")
        correct_files = os.listdir(CORRECT_UPLOAD_FOLDER)
        for f in correct_files:
            print(f"  ✓ {f}")
            
    else:
        print("❌ Wrong upload folder doesn't exist (maybe already fixed?)")
    
    print(f"\n📁 Correct upload folder now has: {len(os.listdir(CORRECT_UPLOAD_FOLDER))} files")

if __name__ == "__main__":
    print("=" * 60)
    print("UPLOAD FOLDER FIX SCRIPT")
    print("=" * 60)
    fix_uploads()
    print("=" * 60)
    print("\n✅ Done! Now restart Flask server")