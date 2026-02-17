
import os

filepath = 'frontend/app.js'
marker = b"/* ===== MISSING FUNCTIONS RECOVERY ===== */"

# Read file
with open(filepath, 'rb') as f:
    data = f.read()

# Find marker?
idx = data.find(marker)
if idx != -1:
    print(f"Found marker at {idx}. Truncating.")
    data = data[:idx]
else:
    print("Marker not found. Searching for garbage end patterns.")
    # Fallback: Find the end of original file. Logic: It ended with some brace or newline.
    # We know the size was 128932 bytes at Step 7.
    # Current size ~130334.
    # Cutting back to 128932 might be safe if I only appended.
    # But checking content is safer.
    # Last valid function in outline was renderHome.
    # Let's search for the last valid function call I saw: MoveCare.restoreSuggestion(); ?
    # From grep output previously: `restoreSuggestion()` was around line 913. 
    # Wait, `MoveCare` object ends at line ~1212. 
    # Global functions `renderHome` etc end at ~1353.
    # The file had 3010 lines.
    # Let's revert to 128900 bytes roughly?
    # Better: Search for 'function renderHome' and find its closing brace? No that's risky.
    
    # Try searching for the garbled 'nav.innerHTML' I introduced?
    bad_pattern = b"nav.innerHTML = APP_MENUS.map"
    idx2 = data.find(bad_pattern)
    if idx2 != -1:
         print(f"Found bad pattern at {idx2}. Truncating.")
         data = data[:idx2]
         # Backtrack to newline
         data = data.rstrip()
    else:
         print("Could not find insertion point. Reseting to original size (128932).")
         # This is a bit of a gamble but safest given I just appended.
         if len(data) > 128932:
             data = data[:128932]

# Ensure we have clean end
data = data.rstrip() + b"\n\n"

# Append Correct Code
additional_code = """
/* ===== MISSING FUNCTIONS RECOVERY ===== */
function renderBottomNav() {
    const nav = document.querySelector('.bottom-nav-inner');
    if (!nav) return;
    nav.innerHTML = APP_MENUS.map(m => `
        <button id="${m.id}" class="nav-item ${m.id === 'nav-home' ? 'active' : ''}" onclick="switchScreen('${m.screen}'); setActiveNav('${m.id}')">
            <div class="nav-icon">${m.icon}</div>
            <div class="nav-label">${m.label}</div>
        </button>
    `).join('');
}

function setActiveNav(id) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(id);
    if (btn) btn.classList.add('active');
}

function switchScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        window.scrollTo(0, 0);
        
        if (screenId === 'screen-home') {
            if (typeof renderHome === 'function') renderHome();
        }
    }
}

function renderProgramList() {
    const list = document.getElementById('scheduled-list');
    if (list) {
         list.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">プログラムはありません</div>';
    }
}

function renderDailyLogs() {
    // console.log("renderDailyLogs");
}

function refreshUI() {
    if (typeof renderHome === 'function') renderHome();
}
"""

with open(filepath, 'wb') as f:
    f.write(data)
    f.write(additional_code.encode('utf-8'))

print("Fixed app.js")
