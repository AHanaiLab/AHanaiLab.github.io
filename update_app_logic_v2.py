
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Enable Debug Alert
if '// alert(`Debug: Loaded Logs:' in content:
    content = content.replace('// alert(`Debug: Loaded Logs:', 'alert(`Debug: Loaded Logs:')
    print("Enabled debug alert.")
else:
    print("Debug alert line not found (or already enabled).")

# 2. Add Power/Home updates to handleVo2Submit
# We look for the block added in Step 303/314
marker_start = '// FORCE UPDATE DOM (Safety net)'
marker_end = 'document.getElementById("vo2-latest-label").textContent = "たった今 / 記録済み";\n    }'

# The previous block was:
#     // FORCE UPDATE DOM (Safety net)
#     const valEl = document.getElementById("vo2-latest-value");
#     if (valEl) {
#         valEl.textContent = vo2.toFixed(1);
#         document.getElementById("vo2-latest-mets").textContent = `${(vo2/3.5).toFixed(1)} METs 相当`;
#         document.getElementById("vo2-latest-label").textContent = "たった今 / 記録済み";
#     }

# We want to append Power and Home updates after this block, before the alert.

new_logic = """
    // Force Update Power
    const pReport = document.getElementById("power-report");
    if (power && pReport) {
        pReport.classList.remove("hidden");
        document.getElementById("power-value").textContent = power.toFixed(2);
    }

    // Force Update Home Screen
    const homeEl = document.getElementById("home-vo2-display");
    if (homeEl) {
        const mets = vo2/3.5;
        homeEl.textContent = `VO₂max ${vo2.toFixed(1)} (${mets.toFixed(1)} METs)`;
    }
"""

if marker_start in content:
    # Find the closing brace of the if(valEl) block
    idx = content.find(marker_end)
    if idx != -1:
        insert_pos = idx + len(marker_end)
        content = content[:insert_pos] + new_logic + content[insert_pos:]
        print("Inserted Power/Home update logic.")
    else:
        print("Marker end not found.")
else:
    print("Marker start not found.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
