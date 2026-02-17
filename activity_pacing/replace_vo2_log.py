
path = 'frontend/app.js'

# Indentation must match exactly (4 spaces)
target_snippet = """    // Log to AWS
    if (AppState.subject) {
        const logPayload = {
            userId: String(AppState.subject.id),
            timestamp: new Date().toISOString(),
            type: "vo2max",
            value: record.value,
            source: record.source,
            power: record.power
        };

        fetch(`${AWS_CONFIG.apiBase}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logPayload)
        }).catch(e => console.error("VO2 Log Error", e));
    }"""

replacement = """    // Log to AWS
    if (AppState.subject) {
        const logData = {
            type: "vo2max",
            date: new Date().toISOString(),
            value: record.value,
            source: record.source,
            power: record.power
        };

        fetch(`${AWS_CONFIG.apiBase}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subjectId: String(AppState.subject.id),
                log: logData
            })
        }).catch(e => console.error("VO2 Log Error", e));
    }"""

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    # Try generic
    with open(path, 'r') as f:
        content = f.read()

if target_snippet in content:
    new_content = content.replace(target_snippet, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Snippet not found")
    # Try looser matching by removing whitespace? No, risky.
    # Show actual content for debug
    lines = content.split('\n')
    # Find approx location
    try:
        start = -1
        for i, line in enumerate(lines):
            if "// Log to AWS" in line and "AppState.subject" in lines[i+1]:
                start = i
                break
        if start != -1:
             print("Found start at", start)
             print('\n'.join(lines[start:start+20]))
        else:
             print("Could not find start pattern")
    except:
        pass
