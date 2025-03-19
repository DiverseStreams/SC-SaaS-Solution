#!/bin/bash

echo "# Repository Inventory" > INVENTORY.md
echo "Generated on: $(date)" >> INVENTORY.md
echo "" >> INVENTORY.md

for repo in */; do
    if [ -d "$repo/.git" ]; then
        echo "## ${repo%/}" >> INVENTORY.md
        
        # Repository Status
        echo "### Repository Status:" >> INVENTORY.md
        (cd "$repo" && git status --short) >> INVENTORY.md
        echo "" >> INVENTORY.md
        
        # List active branches
        echo "### Active Branches:" >> INVENTORY.md
        (cd "$repo" && git branch -a | grep -v HEAD) >> INVENTORY.md
        echo "" >> INVENTORY.md
        
        # Last Commit
        echo "### Latest Commit:" >> INVENTORY.md
        (cd "$repo" && git log -1 --pretty=format:"%h - %s (%cr) <%an>") >> INVENTORY.md
        echo "" >> INVENTORY.md
        
        # List key files
        echo "### Key Files:" >> INVENTORY.md
        echo "#### Lambda Functions:" >> INVENTORY.md
        (cd "$repo" && find . -type f -path "*/lambda/*" -name "*.js" -o -name "*.ts") >> INVENTORY.md
        echo "" >> INVENTORY.md
        
        echo "#### React Components:" >> INVENTORY.md
        (cd "$repo" && find . -type f -path "*/components/*" -name "*.tsx" -o -name "*.jsx") >> INVENTORY.md
        echo "" >> INVENTORY.md
        
        echo "#### Infrastructure:" >> INVENTORY.md
        (cd "$repo" && find . -type f -path "*/infrastructure/*") >> INVENTORY.md
        echo "" >> INVENTORY.md
        
        # Dependencies Check
        if [ -f "$repo/package.json" ]; then
            echo "### Dependencies Analysis" >> INVENTORY.md
            echo "#### Package.json Found" >> INVENTORY.md
            echo '```json' >> INVENTORY.md
            cat "${repo}package.json" >> INVENTORY.md
            echo '```' >> INVENTORY.md
            
            # Check for duplicate dependencies
            if [ -f "$repo/package-lock.json" ]; then
                echo "#### Package Lock Found" >> INVENTORY.md
            fi
        fi
        
        echo -e "\n---\n" >> INVENTORY.md
    fi
done
