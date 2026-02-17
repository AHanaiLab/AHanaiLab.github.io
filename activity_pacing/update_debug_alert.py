
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the debug alert line
# It was: alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);
# We want to insert calculation of vLogs before alerting, or just alert inside the try block where vLogs is defined.

# Ideally, we put the alert AFTER vLogs definition.
# Current code structure (from Step 314 + 318):
#             if (sessionData.logs && Array.isArray(sessionData.logs)) {
#                 alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);
#                 
#                 try {
#                     // Check for multiple field variations and case-insensitivity
#                     const vLogs = sessionData.logs.filter(l => ...

# We want to change the alert to be AFTER vLogs creation.
# But vLogs is const inside try block.

# Strategy: Replace the whole block again with a version that alerts vLogs.length.

target_block_start = """            if (sessionData.logs && Array.isArray(sessionData.logs)) {
                alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);
                
                try {
                    // Check for multiple field variations and case-insensitivity
                    const vLogs = sessionData.logs.filter(l => 
                        (l.type && String(l.type).toLowerCase() === 'vo2max') || 
                        (l.value && l.source) // Fallback
                    );"""

# We want to inject alert after vLogs definition.

replacement_block = """            if (sessionData.logs && Array.isArray(sessionData.logs)) {
                try {
                    // Check for multiple field variations and case-insensitivity
                    const vLogs = sessionData.logs.filter(l => 
                        (l.type && String(l.type).toLowerCase() === 'vo2max') || 
                        (l.value && l.source) // Fallback
                    );
                    
                    // Detailed Debug Alert
                    const lastLog = sessionData.logs[sessionData.logs.length-1];
                    alert(`Debug: Total=${sessionData.logs.length}, LastType=${lastLog ? lastLog.type : 'null'}, Filtered=${vLogs.length}`);
"""

# Note: The original code had the alert BEFORE try.
# We need to match what is currently in the file.
# The current file has:
#             if (sessionData.logs && Array.isArray(sessionData.logs)) {
#                 alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);
#                 
#                 try {

# We'll use find/replace string.

search_str = """            if (sessionData.logs && Array.isArray(sessionData.logs)) {
                alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);
                
                try {
                    // Check for multiple field variations and case-insensitivity
                    const vLogs = sessionData.logs.filter(l => 
                        (l.type && String(l.type).toLowerCase() === 'vo2max') || 
                        (l.value && l.source) // Fallback
                    );"""

replace_str = """            if (sessionData.logs && Array.isArray(sessionData.logs)) {
                try {
                    // Check for multiple field variations and case-insensitivity
                    const vLogs = sessionData.logs.filter(l => 
                        (l.type && String(l.type).toLowerCase() === 'vo2max') || 
                        (l.value && l.source) // Fallback
                    );
                    
                    // Detailed Debug Alert
                    const lastLog = sessionData.logs.length > 0 ? sessionData.logs[sessionData.logs.length-1] : null;
                    alert(`Debug: Total=${sessionData.logs.length}, LastType=${lastLog ? lastLog.type : 'null'}, Filtered=${vLogs.length}`);"""

if search_str in content:
    content = content.replace(search_str, replace_str)
    print("Replaced debug alert logic.")
else:
    # Try more lenient matching if strict match fails (e.g. whitespace)
    # Using the python script to remove the old alert line first
    if 'alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);' in content:
        content = content.replace('alert(`Debug: Loaded Logs: ${sessionData.logs.length}`);', '')
        # Now insert new alert after vLogs definition
        vlogs_def = """                        (l.value && l.source) // Fallback
                    );"""
        
        new_alert = """                        (l.value && l.source) // Fallback
                    );
                    const lastLog = sessionData.logs.length > 0 ? sessionData.logs[sessionData.logs.length-1] : null;
                    alert(`Debug: Total=${sessionData.logs.length}, LastType=${lastLog ? lastLog.type : 'null'}, Filtered=${vLogs.length}`);"""
        
        content = content.replace(vlogs_def, new_alert)
        print("Replaced debug alert logic (lenient mode).")
    else:
        print("Could not find debug alert line.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
