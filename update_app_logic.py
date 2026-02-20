
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False

start_marker = "            // Restore VO2 Records from Logs"
end_marker = '                    localStorage.setItem(STORAGE_KEY_VO2, JSON.stringify(AppState.vo2Records));'
end_marker_next_line = '                }'
end_marker_next_next_line = '            }'

# New logic to insert
new_logic = """            // Restore VO2 Records from Logs (Robust Version)
            if (sessionData.logs && Array.isArray(sessionData.logs)) {
                try {
                    // Check for multiple field variations and case-insensitivity
                    const vLogs = sessionData.logs.filter(l => 
                        (l.type && String(l.type).toLowerCase() === 'vo2max') || 
                        (l.value && l.source) // Fallback
                    );
                    
                    if (vLogs.length > 0) {
                        AppState.vo2Records = vLogs.map(l => ({
                            date: l.timestamp || l.date || new Date().toISOString(),
                            value: Number(l.value),
                            source: l.source || 'Direct',
                            power: l.power ? Number(l.power) : null
                        })).filter(r => !isNaN(r.value));
                        
                        AppState.vo2Records.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

                        if (AppState.vo2Records.length > 0) {
                            AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;
                        }
                        
                        localStorage.setItem(STORAGE_KEY_VO2, JSON.stringify(AppState.vo2Records));
                    }
                } catch (e) {
                    console.warn("Log parse fix error", e);
                }
            }
"""

i = 0
found = False
while i < len(lines):
    line = lines[i]
    if start_marker in line and not found:
        # Start replacement
        new_lines.append(new_logic)
        found = True
        # Skip until we pass the end of the block
        # The block ends with 2 closing braces after localStorage line
        # We need to find the specific closing sequence
        # Hardcoding skip based on known current content is risky but effective if careful
        
        # Let's verify context.
        # Original block has about 21 lines.
        # We scan for the end marker.
        j = i
        while j < len(lines):
            if 'localStorage.setItem(STORAGE_KEY_VO2' in lines[j]:
                # Found the end of logic lines.
                # The next two lines should be closing braces.
                i = j + 3 # Skip this line and two closing braces lines
                break
            j += 1
    else:
        new_lines.append(line)
        i += 1

if found:
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully replaced logic.")
else:
    print("Target marker not found.")
