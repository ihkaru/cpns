#!/bin/bash

# ==============================================================================
# Hook Installer Script
# Automates copying and setting permissions for git hooks in the repository.
# ==============================================================================

HOOK_SRC="scripts/pre-commit-check.sh"
HOOK_DEST=".git/hooks/pre-commit"

if [ ! -f "$HOOK_SRC" ]; then
    echo -e "\033[0;31mError: Source hook script not found at $HOOK_SRC\033[0m"
    exit 1
fi

# Ensure .git/hooks directory exists
mkdir -p .git/hooks

# Copy and set executable permissions
cp "$HOOK_SRC" "$HOOK_DEST"
chmod +x "$HOOK_DEST"

echo -e "\033[0;32m✓ Git pre-commit hook (700-line limit check) installed successfully!\033[0m"
