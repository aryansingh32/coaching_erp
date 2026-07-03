#!/bin/bash
echo "Starting extraction..."
# NestJS and Custom Express Routes
find . -type f \( -name "*.ts" -o -name "*.js" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -path "*/public/*" -not -path "*/build/*" | xargs grep -E "@(Get|Post|Put|Delete|Patch)\(|(axios|fetch)\.(get|post|put|delete|patch)" > nest_routes.txt || true

# Frappe Whitelists
find . -type f -name "*.py" -not -path "*/node_modules/*" -not -path "*/.git/*" | xargs grep -E "@frappe\.whitelist" > frappe_routes.txt || true

# Moodle Webservices
find . -type f -name "*.php" -not -path "*/node_modules/*" -not -path "*/.git/*" | xargs grep -E "'classname'\s*=>" > moodle_routes.txt || true

echo "Extraction complete."
