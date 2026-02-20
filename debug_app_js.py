
with open('frontend/app.js', 'rb') as f:
    content = f.read()

# Try to find the marker I added, or the end of valid code.
# The marker should be around the end.
# If I added utf-16 chars, they will look like Null bytes.

print(f"Total size: {len(content)}")
print("Last 200 bytes raw:", content[-200:])

try:
    print("Last 500 chars decoded:", content[-500:].decode('utf-8'))
except:
    print("Decode failed")
