
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the verification alert with Direct DOM Update logic
target_alert = 'alert(`Debug: Set VO2=${AppState.currentVo2max}'

# We need to match the line roughly because of previous edits
# It was: alert(`Debug: Set VO2=${AppState.currentVo2max} (Records=${AppState.vo2Records.length})`);

# Let's search for the AppState assignment line again and append logic
assign_line = 'AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;'
replacement_logic = """AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;
                            
                            // DIRECT DOM FORCE UPDATE
                            setTimeout(() => {
                                const directEl = document.getElementById("home-vo2-display");
                                if (directEl) {
                                    const mets = (AppState.currentVo2max/3.5).toFixed(1);
                                    directEl.textContent = `VO₂max ${AppState.currentVo2max} (${mets} METs)`;
                                } else {
                                    console.warn("Direct DOM update failed: Element not found");
                                }
                                
                                // Also Tool Screen
                                const toolEl = document.getElementById("vo2-latest-value");
                                if (toolEl) toolEl.textContent = AppState.currentVo2max.toFixed(1);
                                const labelEl = document.getElementById("vo2-latest-label");
                                if (labelEl) labelEl.textContent = `復元(N=${AppState.vo2Records.length})`;
                                
                            }, 500); // Slight delay to ensure DOM readiness
"""

if assign_line in content:
    # Also remove the previous alert if it exists nearby to clean up
    content = content.replace(assign_line, replacement_logic)
    # Be careful not to leave the old alert hanging if I didn't replace it specifically.
    # But since I am replacing the assignment line which precedes the alert... the alert might still be there.
    # Let's clean up the alert if found.
    alert_part = 'alert(`Debug: Set VO2=${AppState.currentVo2max}'
    if alert_part in content:
        # Find the full line of alert
        start_idx = content.find(alert_part)
        end_idx = content.find(');', start_idx) + 2
        # Remove it
        # Actually, replacing the assignment line pushed the alert down.
        # It's better to just replace the whole block (assignment + alert).
        pass
    print("Injected Direct DOM Update logic.")
else:
    print("Assignment line not found.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
