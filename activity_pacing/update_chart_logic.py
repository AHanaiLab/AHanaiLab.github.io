
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Debug Alerts
# Step 327 warning (login error) - keep
# Step 392 "Debug: Set VO2" - remove
if '// Verification Alert' in content:
    content = content.replace('// Verification Alert', '')

alert_pattern = 'alert(`Debug: Set VO2='
start_idx = content.find(alert_pattern)
if start_idx != -1:
    end_idx = content.find(');', start_idx) + 2
    content = content[:start_idx] + content[end_idx:]
    print("Removed Debug: Set VO2 alert")

alert_pattern_2 = 'alert(`Debug: Total='
start_idx_2 = content.find(alert_pattern_2)
if start_idx_2 != -1:
    end_idx_2 = content.find(');', start_idx_2) + 2
    content = content[:start_idx_2] + content[end_idx_2:]
    print("Removed Debug: Total alert")


# 2. Replace renderVo2Chart
# Find existing function
start_marker = 'function renderVo2Chart() {'
end_marker = '/* ===== Power Calculation ===== */' # Assuming this follows, based on previous ViewFile?
# No, actually let's re-read file to be safe or use intelligent replacement.
# Usually renderVo2Chart is near the end.

new_chart_logic = """function renderVo2Chart() {
    const ctx = document.getElementById('vo2-chart');
    if (!ctx) return;
    
    if (!AppState.vo2Records || AppState.vo2Records.length === 0) return;

    // Helper: Simple Date Format (MM/DD)
    const formatDate = (iso) => {
        try {
            const d = new Date(iso);
            return `${d.getMonth()+1}/${d.getDate()}`;
        } catch(e) { return iso; }
    };

    const labels = AppState.vo2Records.map(r => formatDate(r.date));
    const vo2Data = AppState.vo2Records.map(r => r.value);
    const powerData = AppState.vo2Records.map(r => r.power || null);

    // Destroy existing chart if any to prevent memory leaks
    if (window.myVo2Chart) {
        window.myVo2Chart.destroy();
    }

    window.myVo2Chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'VO₂max (ml/kg/min)',
                    data: vo2Data,
                    borderColor: 'rgb(14, 165, 233)', // Sky Blue
                    backgroundColor: 'rgba(14, 165, 233, 0.5)',
                    yAxisID: 'y',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: '筋力 (W/kg)',
                    data: powerData,
                    borderColor: 'rgb(249, 115, 22)', // Orange
                    backgroundColor: 'rgba(249, 115, 22, 0.5)',
                    yAxisID: 'y1',
                    tension: 0.3,
                    fill: false,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'VO₂max' },
                    min: 0
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Power' },
                    grid: {
                        drawOnChartArea: false,
                    },
                    min: 0
                },
                x: {
                    ticks: {
                        maxTicksLimit: 10 // Limit x-axis labels
                    }
                }
            }
        }
    });
}
"""

# Replace logic
if start_marker in content:
    # We need to find the end of the function block.
    # It scans until next function or end of file?
    # Let's search for "function renderVo2Latest" which likely follows it or similar.
    
    # Or count braces...
    idx = content.find(start_marker)
    # let's assume the old function is roughly 30 lines.
    # scan for the next function declaration
    next_func = 'function renderVo2Latest() {'
    end_idx = content.find(next_func, idx)
    
    if end_idx != -1:
        content = content[:idx] + new_chart_logic + "\n\n" + content[end_idx:]
        print("Replaced renderVo2Chart logic.")
    else:
        print("Next function marker not found. Trying alternative method.")
        # If renderVo2Latest is not next, try to match the closing brace of renderVo2Chart
        # This is risky without parsing.
        pass
else:
    print("renderVo2Chart function not found.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
