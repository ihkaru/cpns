import os

# Root path of the repository
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Simple directory name ignores (matches any folder with this name anywhere in tree)
IGNORE_DIR_NAMES = {
    '.git', 'node_modules', 'vendor', 'dist', '__pycache__', '.vscode',
    '.idea', 'apk_extracted', 'xapk_extracted', 'captured', 'storage',
    'backup_pwa_lama',  # archived old PWA code, not active
}

# Relative-path ignores (matches folders by path from repo root, to avoid false positives)
IGNORE_DIR_PATHS = {
    'backend/bootstrap/cache',   # Laravel generated cache
    'backend/storage',           # Laravel runtime storage
}

IGNORE_FILES = {
    'composer.lock', 'bun.lock', 'package-lock.json', '.DS_Store', 'Thumbs.db',
    'bank_soal_cpns.json', 'bank_soal_cpns.sql', 'scraped_packets_manifest.json',
    'repo_structure.txt'
}

IGNORE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.zip', '.apk', '.xapk',
    '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.pyc', '.pyo', '.pyd', '.db'
}

def count_lines(filepath):
    """Helper to count lines in a text file safely."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception:
        return 0

def should_ignore_dir(dirname, rel_path):
    """Check if a directory should be ignored by name OR by relative path from repo root."""
    if dirname in IGNORE_DIR_NAMES:
        return True
    # Normalize path separators for cross-platform safety
    normalized = rel_path.replace(os.sep, '/')
    if normalized in IGNORE_DIR_PATHS:
        return True
    return False

def should_ignore_file(filename):
    if filename in IGNORE_FILES:
        return True
    ext = os.path.splitext(filename)[1].lower()
    if ext in IGNORE_EXTENSIONS:
        return True
    return False

def generate_structure():
    file_list = []
    tree_lines = []

    def walk(directory, prefix=""):
        try:
            items = sorted(os.listdir(directory))
        except Exception:
            return

        dirs = []
        files = []
        for item in items:
            path = os.path.join(directory, item)
            rel_path = os.path.relpath(path, ROOT_DIR)
            if os.path.isdir(path):
                if not should_ignore_dir(item, rel_path):
                    dirs.append(item)
            else:
                if not should_ignore_file(item):
                    files.append(item)

        all_items = [(d, True) for d in dirs] + [(f, False) for f in files]

        for i, (name, is_dir) in enumerate(all_items):
            is_last = (i == len(all_items) - 1)
            connector = "└── " if is_last else "├── "

            if is_dir:
                tree_lines.append(f"{prefix}{connector}{name}/")
                new_prefix = prefix + ("    " if is_last else "│   ")
                walk(os.path.join(directory, name), new_prefix)
            else:
                filepath = os.path.join(directory, name)
                lines = count_lines(filepath)
                rel_path = os.path.relpath(filepath, ROOT_DIR)
                file_list.append((rel_path, lines))
                tree_lines.append(f"{prefix}{connector}{name} ({lines} lines)")

    walk(ROOT_DIR)

    # Sort files by line count descending to find the top 5 largest files
    top_files = sorted(file_list, key=lambda x: x[1], reverse=True)[:5]

    output = []
    output.append("====================================================")
    output.append("             AKSARACAT REPO STRUCTURE               ")
    output.append("====================================================")
    output.append("\n".join(tree_lines))
    output.append("\n====================================================")
    output.append("          TOP 5 FILES BY LINE COUNT                 ")
    output.append("====================================================")
    for rank, (rel_path, lines) in enumerate(top_files, 1):
        output.append(f"{rank}. {rel_path} ({lines} lines)")

    return "\n".join(output)

if __name__ == "__main__":
    structure_text = generate_structure()
    print(structure_text)

    # Save output to repo_structure.txt at root directory
    out_path = os.path.join(ROOT_DIR, "repo_structure.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(structure_text)
    print(f"\n[INFO] Structure successfully written to: {out_path}")
