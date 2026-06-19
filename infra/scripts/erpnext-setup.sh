#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  CoachingOS — ERPNext + Education Module Setup Script               ║
# ║  Run ONCE after first docker compose up                             ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# Load environment variables from .env if present
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  export $(grep -v '^#' .env | xargs)
elif [ -f ../.env ]; then
  echo "Loading environment variables from ../.env..."
  export $(grep -v '^#' ../.env | xargs)
fi

echo "⏳ Waiting for ERPNext to be ready..."
until docker compose exec -T erpnext bench --version 2>/dev/null; do
  echo "  ERPNext not ready yet, retrying in 10s..."
  sleep 10
done
echo "✅ ERPNext is running"

echo "📦 Creating site..."
docker compose exec -T erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench new-site erp.coaching-internal \
    --db-host erpnext-db \
    --mariadb-root-password ${ERPNEXT_DB_ROOT_PASSWORD:-erpnext_root_pass} \
    --admin-password ${ERPNEXT_ADMIN_PASSWORD:-admin} \
    --no-mariadb-socket || echo 'Site may already exist, continuing...'
"

echo "📦 Installing apps: erpnext → hrms → education..."
docker compose exec -T erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench --site erp.coaching-internal install-app erpnext || echo 'erpnext already installed' && \
  bench --site erp.coaching-internal install-app education || echo 'education already installed'
"

echo "🔧 Enabling CORS for gateway access..."
docker compose exec -T erpnext bash -c "
  cd /home/frappe/frappe-bench && \
  bench --site erp.coaching-internal set-config allow_cors 1 && \
  bench --site erp.coaching-internal set-config cors_origin 'http://gateway:3000'
"

echo "🔑 Creating API user for gateway..."
echo "   ⚠️  MANUAL STEP REQUIRED:"
echo "   1. Open ERPNext at http://localhost:8000"
echo "   2. Go to Settings → API Access → New Key"
echo "   3. Set Role: System Manager"
echo "   4. Copy API Key + Secret to .env (ERPNEXT_API_KEY, ERPNEXT_API_SECRET)"

echo ""
echo "✅ ERPNext + Education setup complete!"
echo "   Site: erp.coaching-internal"
echo "   Apps: erpnext, education"
