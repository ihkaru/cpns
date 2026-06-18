#!/bin/bash

# ==============================================================================
# Git Pre-commit Hook: File Line Count Limit
# Protects the codebase from bloating by rejecting commits with files > 700 lines.
# ==============================================================================

MAX_LINES=700

# Get list of staged files (Added, Copied, Modified, Renamed)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

FAILED=0

for FILE in $STAGED_FILES; do
    # Skip directories, non-existent files (safeguard)
    if [ ! -f "$FILE" ]; then
        continue
    fi

    # Exclude files that are naturally large and non-code/config
    # E.g. translation JSONs, database seeds, package lock files, image assets
    if [[ "$FILE" =~ \.(json|lockb|lock|png|jpg|jpeg|gif|ico|svg|pdf|zip|tar|gz|apk|keystore|env.*)$ ]]; then
        continue
    fi

    # Best Practice: Read the line count of the STAGED version of the file
    # This prevents bypassing checks by staging one version and modifying another in working tree
    LINE_COUNT=$(git show :"$FILE" | wc -l)

    if [ "$LINE_COUNT" -gt "$MAX_LINES" ]; then
        echo -e "\033[0;31m[ERROR] Commit Rejected:\033[0m"
        echo -e "  File: \033[1;37m$FILE\033[0m"
        echo -e "  Line Count: \033[1;31m$LINE_COUNT\033[0m lines (Limit: \033[1;32m$MAX_LINES\033[0m)"
        echo -e "  \033[0;33mAdvice: Please refactor and split this file into smaller, modular files/components.\033[0m"
        FAILED=1
    fi
done

if [ "$FAILED" -ne 0 ]; then
    echo -e "\033[0;31mError: Commit aborted due to file size constraints.\033[0m"
    exit 1
fi

exit 0
