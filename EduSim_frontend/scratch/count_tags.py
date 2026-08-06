import re

with open('src/components/simulation/FloatingSimulationWorkspaceOverlay.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')
subset = '\n'.join(lines[641:]) # 642 is index 641

open_divs = len(re.findall(r'<div(?![a-zA-Z])', subset))
close_divs = len(re.findall(r'</div(?![a-zA-Z])', subset))
open_motion = len(re.findall(r'<motion\.div(?![a-zA-Z])', subset))
close_motion = len(re.findall(r'</motion\.div(?![a-zA-Z])', subset))

print(f"Divs: {open_divs} / {close_divs}")
print(f"Motion: {open_motion} / {close_motion}")
