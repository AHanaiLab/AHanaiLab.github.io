
import os

path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add debug alert inside the assignment block
target = 'AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;'
replacement = """AppState.currentVo2max = AppState.vo2Records[AppState.vo2Records.length - 1].value;
                            // Verification Alert
                            alert(`Debug: Set VO2=${AppState.currentVo2max} (Records=${AppState.vo2Records.length})`);"""

if target in content:
    content = content.replace(target, replacement)
    print("Added verification alert.")
else:
    print("Target assignment line not found.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
