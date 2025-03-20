#!/bin/bash

for repo in */; do
    if [ -d "$repo/.git" ]; then
        echo "## ${repo%/}" >> INVENTORY.md
        echo "### Active Branches:" >> INVENTORY.md
        (cd "$repo" && git branch -a | grep -v HEAD) >> INVENTORY.md
        echo -e "\n### Key Files:" >> INVENTORY.md
        (cd "$repo" && find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" | grep -v "node_modules") >> INVENTORY.md
        echo -e "\n### Dependencies:" >> INVENTORY.md
        if [ -f "$repo/package.json" ]; then
            (cd "$repo" && jq '.dependencies' package.json) >> INVENTORY.md
        fi
        echo -e "\n---\n" >> INVENTORY.md
    fi
done
