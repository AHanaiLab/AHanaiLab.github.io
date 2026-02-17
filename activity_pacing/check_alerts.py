
path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'alert(' in line and 'Debug:' in line:
            print("Found Debug Alert:", line.strip())
