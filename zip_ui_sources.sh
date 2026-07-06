#!/bin/bash

# Script to zip UI sources for each open-source system
# Run from coaching_erp directory

cd /home/unknown/Desktop/coaching_erp

echo "Zipping UI sources for each open-source system..."

# 1. Moodle UI (PHP templates, course UI, mod UIs)
echo "Creating moodle_ui.zip..."
zip -r moodle_ui.zip moodle/public/course moodle/public/mod moodle/public/grade moodle/public/user moodle/public/theme moodle/public/templates -q

# 2. ERPNext UI (Frappe Desk, templates, assets)
echo "Creating erpnext_ui.zip..."
zip -r erpnext_ui.zip erpnext/erpnext/www erpnext/erpnext/templates erpnext/erpnext/assets erpnext/erpnext/public -q

# 3. BigBlueButton UI (React HTML5 client)
echo "Creating bbb_ui.zip..."
zip -r bbb_ui.zip bigbluebutton/bigbluebutton-html5/client bigbluebutton/bigbluebutton-html5/public -q

# 4. Metabase UI (React frontend)
echo "Creating metabase_ui.zip..."
zip -r metabase_ui.zip metabase/frontend/src/metabase metabase/frontend/public -q

# 5. Education UI (Vue 3 frontend)
echo "Creating education_ui.zip..."
zip -r education_ui.zip education/frontend/src education/frontend/public -q

# 6. Novu UI (React dashboard)
echo "Creating novu_ui.zip..."
zip -r novu_ui.zip novu/apps/dashboard/src novu/apps/dashboard/public -q

# 7. ClickHouse - No UI to zip
echo "Skipping ClickHouse (no UI)"

echo ""
echo "UI source zips created:"
ls -lh /home/unknown/Desktop/coaching_erp/*_ui.zip
