import os

def parse_ls_r(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    tree = {}
    current_path = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        if line.endswith(':'):
            path_str = line[:-1]
            current_path = path_str.split('/')
            temp = tree
            for part in current_path:
                if part not in temp or temp[part] is None:
                    temp[part] = {}
                temp = temp[part]
        else:
            temp = tree
            for part in current_path:
                temp = temp[part]
            if line not in temp:
                temp[line] = None
            
    return tree

def render_tree(tree, prefix=''):
    lines = []
    if not isinstance(tree, dict):
        return lines
        
    keys = sorted(tree.keys())
    
    # Sort: folders first, then files
    folders = [k for k in keys if isinstance(tree[k], dict)]
    files = [k for k in keys if tree[k] is None]
    
    sorted_keys = folders + files
    
    for i, key in enumerate(sorted_keys):
        is_last = (i == len(sorted_keys) - 1)
        connector = '└── ' if is_last else '├── '
        
        if tree[key] is None:
            # File
            lines.append(f"{prefix}{connector}{key}")
        else:
            # Folder
            lines.append(f"{prefix}{connector}{key}/")
            new_prefix = prefix + ('    ' if is_last else '│   ')
            lines.extend(render_tree(tree[key], new_prefix))
            
    return lines

def get_stats_from_tree(tree, stats=None):
    if stats is None:
        stats = {
            "Total Files": 0,
            "Total Folders": 0,
            "Vehicle Assets": 0,
            "Background Assets": 0,
            "Biology Assets": 0,
            "Space Assets": 0,
            "Generic Items": 0
        }
    
    if not isinstance(tree, dict):
        return stats
        
    for key, value in tree.items():
        if value is None:
            stats["Total Files"] += 1
        else:
            stats["Total Folders"] += 1
            low_key = key.lower()
            if "vehicle" in low_key:
                stats["Vehicle Assets"] += count_files(value)
            if "background" in low_key or "environment" in low_key:
                stats["Background Assets"] += count_files(value)
            if "biology" in low_key or "animal" in low_key or "cell" in low_key:
                stats["Biology Assets"] += count_files(value)
            if "space" in low_key or "planet" in low_key or "astronaut" in low_key:
                stats["Space Assets"] += count_files(value)
            if "generic" in low_key or "item" in low_key:
                stats["Generic Items"] += count_files(value)
            get_stats_from_tree(value, stats)
            
    return stats

def count_files(tree):
    if tree is None:
        return 1
    count = 0
    for key, value in tree.items():
        if value is None:
            count += 1
        else:
            count += count_files(value)
    return count

file_path = "/run/media/mythri-banda/A82A7FD52A7F9F4E/Users/Mythri Banda/Downloads/projects/edusim/EduSim_frontend/structure.txt"
tree = parse_ls_r(file_path)

# Extract only the 'public' subtree
public_tree = tree.get('public', {})

markdown_lines = ["# Public Folder Structure", "", "public/"]
markdown_lines.extend(render_tree(public_tree))

stats = get_stats_from_tree(public_tree)

markdown_lines.append("")
markdown_lines.append("## Asset Statistics")
markdown_lines.append("")
for key, value in stats.items():
    markdown_lines.append(f"- {key}: {value}")

output_path = "/run/media/mythri-banda/A82A7FD52A7F9F4E/Users/Mythri Banda/Downloads/projects/edusim/EduSim_frontend/public_structure.md"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(markdown_lines))

print(f"Generated {output_path}")
