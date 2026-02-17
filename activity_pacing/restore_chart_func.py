
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Chart logic to insert
chart_logic = """
function renderVo2Chart() {
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

target = 'function renderVo2Latest() {'

if target in content:
    content = content.replace(target, chart_logic + "\n" + target)
    print("Restored renderVo2Chart function.")
else:
    print("Target function renderVo2Latest not found.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
