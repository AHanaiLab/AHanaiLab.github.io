
path = r"c:/Users/victo/OneDrive/Desktop/LINE trans/frontend/app.js"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

first_found = False
start_del = -1
end_del = -1

for i, line in enumerate(lines):
    if 'function renderVo2Chart' in line:
        if not first_found:
            first_found = True
        else:
            start_del = i
            break

if start_del != -1:
    brace_count = 0
    started = False
    for j in range(start_del, len(lines)):
        line = lines[j]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if '{' in line: started = True
        
        if started and brace_count == 0:
            end_del = j
            break
    
    if end_del != -1:
        # Just to be safe, delete a few empty lines after if present
        del lines[start_del : end_del+1]
        
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print("Deleted duplicate function.")
    else:
        print("Could not find end of function block.")
else:
    print("Only one declaration found.")
