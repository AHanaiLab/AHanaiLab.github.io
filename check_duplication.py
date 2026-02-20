
path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"
count = 0
with open(path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'function renderVo2Chart' in line:
            print(f"Found declaration at line {i+1}")
            count += 1
print(f"Total declarations: {count}")
