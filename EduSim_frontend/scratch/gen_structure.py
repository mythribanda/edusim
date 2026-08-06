import os

def generate_tree(path, prefix=""):
    entries = sorted(os.listdir(path))
    dirs = [e for e in entries if os.path.isdir(os.path.join(path, e))]
    files = [e for e in entries if os.path.isfile(os.path.join(path, e))]
    
    lines = []
    
    # Process folders first
    for i, d in enumerate(dirs):
        is_last = (i == len(dirs) - 1) and (len(files) == 0)
        connector = "└── " if is_last else "├── "
        lines.append(f"{prefix}{connector}{d}/")
        new_prefix = prefix + ("    " if is_last else "│   ")
        lines.extend(generate_tree(os.path.join(path, d), new_prefix))
        
    # Process files second
    for i, f in enumerate(files):
        is_last = (i == len(files) - 1)
        connector = "└── " if is_last else "├── "
        lines.append(f"{prefix}{connector}{f}")
        
    return lines

def get_stats(path):
    stats = {
        "Total Files": 0,
        "Total Folders": 0,
        "Vehicle Assets": 0,
        "Background Assets": 0,
        "Biology Assets": 0,
        "Space Assets": 0,
        "Generic Items": 0
    }
    
    for root, dirs, files in os.walk(path):
        stats["Total Folders"] += len(dirs)
        stats["Total Files"] += len(files)
        
        low_root = root.lower()
        if "vehicle" in low_root:
            stats["Vehicle Assets"] += len(files)
        if "background" in low_root or "environment" in low_root:
            stats["Background Assets"] += len(files)
        if "biology" in low_root or "animal" in low_root or "cell" in low_root:
            stats["Biology Assets"] += len(files)
        if "space" in low_root or "planet" in low_root or "astronaut" in low_root:
            stats["Space Assets"] += len(files)
        if "generic" in low_root or "item" in low_root:
            stats["Generic Items"] += len(files)
            
    return stats

public_path = "/run/media/mythri-banda/A82A7FD52A7F9F4E/Users/Mythri Banda/Downloads/projects/edusim/EduSim_frontend/public"
tree_lines = generate_tree(public_path)
stats = get_stats(public_path)

content = "# Public Folder Structure\n\npublic/\n"
content += "\n".join(tree_lines)
content += "\n\n## Asset Statistics\n\n"
for key, value in stats.items():
    content += f"- {key}: {value}\n"

with open("/run/media/mythri-banda/A82A7FD52A7F9F4E/Users/Mythri Banda/Downloads/projects/edusim/EduSim_frontend/public_structure.md", "w") as f:
    f.write(content)

print("Done")
