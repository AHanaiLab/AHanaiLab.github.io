
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target the previously injected block (or similar)
# We search for "DIRECT DOM FORCE UPDATE"
marker = '// DIRECT DOM FORCE UPDATE'

replacement_logic = """// DIRECT DOM FORCE UPDATE
                            setTimeout(() => {
                                // 1. Home VO2
                                const directEl = document.getElementById("home-vo2-display");
                                if (directEl) {
                                    const mets = (AppState.currentVo2max/3.5).toFixed(1);
                                    directEl.textContent = `VO₂max ${AppState.currentVo2max} (${mets} METs)`;
                                }

                                // 2. Tool VO2
                                const toolEl = document.getElementById("vo2-latest-value");
                                if (toolEl) toolEl.textContent = AppState.currentVo2max.toFixed(1);
                                
                                const metsEl = document.getElementById("vo2-latest-mets");
                                if (metsEl) metsEl.textContent = `${(AppState.currentVo2max/3.5).toFixed(1)} METs 相当`;

                                // Clean up label (Remove N=...)
                                const labelEl = document.getElementById("vo2-latest-label");
                                const lastRec = AppState.vo2Records[AppState.vo2Records.length-1];
                                if (labelEl && lastRec) {
                                     // Date formatting if possible, simple string for now
                                     // Only show date part YYYY-MM-DD
                                     const storedDate = lastRec.date.split('T')[0];
                                     labelEl.textContent = `${storedDate} / ${lastRec.source}`;
                                }

                                // 3. Tool Power (Muscle Strength)
                                // Find latest power record
                                const pRec = AppState.vo2Records.slice().reverse().find(r => r.power);
                                const pReport = document.getElementById("power-report");
                                if (pRec && pReport) {
                                    pReport.classList.remove("hidden");
                                    const pVal = document.getElementById("power-value");
                                    if(pVal) pVal.textContent = pRec.power.toFixed(2);
                                    
                                    // Power Assessment logic copy from estimatePowerAlcazar if needed
                                    // Or just show raw value
                                    const pAssess = document.getElementById("power-assessment");
                                    if(pAssess) {
                                        // Simple assessment: > 2.5 is good for elderly, etc. Just showing value for now.
                                        pAssess.textContent = "測定完了"; 
                                    }
                                }
                                
                                // 4. Chart Render (Delayed & Force)
                                if (typeof renderVo2Chart === 'function') {
                                    try { renderVo2Chart(); } catch(e) { console.warn("Chart render retry error", e); }
                                }
                                
                            }, 800); // 800ms delay to be safe
"""

if marker in content:
    # We need to replace the whole setTimeout block following the marker.
    # The block ends with "}, 500); // Slight delay..."
    
    start_idx = content.find(marker)
    # Find the end of the timeout block
    end_marker = '}, 500); // Slight delay'
    end_idx = content.find(end_marker, start_idx)
    
    if end_idx != -1:
        # Include the end marker length
        # But wait, we want to replace from start to end + length
        # The replacement string includes the marker.
        
        # Actually, let's just use string replacement of the specific block I wrote before.
        # Step 403 content.
        
        old_block = """// DIRECT DOM FORCE UPDATE
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
                                
                            }, 500); // Slight delay to ensure DOM readiness"""
        
        content = content.replace(old_block, replacement_logic)
        print("Updated display logic with Power and Chart support.")
        
    else:
        print("End marker not found in app.js content.")

else:
    print("Marker '// DIRECT DOM FORCE UPDATE' not found.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
