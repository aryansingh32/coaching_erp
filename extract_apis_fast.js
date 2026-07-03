const { execSync } = require('child_process');
const fs = require('fs');

console.log("Starting static analysis using grep...");

const apis = [];

// Grep configuration to avoid huge dirs
const excludes = "--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=build --exclude-dir=public --exclude-dir=docs";

function runGrep(pattern, type, methodParser) {
    try {
        const out = execSync(`grep -rE "${pattern}" ${excludes} . --line-number`, { maxBuffer: 1024 * 1024 * 50 }).toString();
        const lines = out.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            // output format: ./file:line:content
            const firstColon = line.indexOf(':');
            const secondColon = line.indexOf(':', firstColon + 1);
            if (firstColon > -1 && secondColon > -1) {
                const file = line.substring(0, firstColon);
                const content = line.substring(secondColon + 1);
                const methodData = methodParser(content, file);
                if (methodData) {
                    apis.push({ system: type, file, ...methodData });
                }
            }
        }
    } catch (e) {
        // grep returns 1 if no matches
    }
}

// 1. NestJS Controllers
runGrep('@(Get|Post|Put|Delete|Patch)\\(', 'NestJS/Custom', (content) => {
    const m = content.match(/@(Get|Post|Put|Delete|Patch)\(['"]([^'"]*)['"]\)/);
    if (m) return { method: m[1].toUpperCase(), route: `/${m[2]}` };
    const mEmpty = content.match(/@(Get|Post|Put|Delete|Patch)\(\)/);
    if (mEmpty) return { method: mEmpty[1].toUpperCase(), route: `/` };
    return null;
});

// 2. Frappe Whitelisted APIs (ERPNext)
runGrep('@frappe\\.whitelist', 'ERPNext/Frappe', (content, file) => {
    return { method: 'POST/GET', route: `Whitelist Route in ${file.split('/').pop()}` };
});

// 3. Moodle Web Services
runGrep("'classname'\\s*=>", 'Moodle', (content) => {
    const m = content.match(/'classname'\s*=>\s*'([^']+)'/);
    if (m) return { method: 'POST/GET', route: `webservice: ${m[1]}` };
    return null;
});

// 4. Frontend Usage
runGrep('(axios|fetch)\\.(get|post|put|delete|patch)\\(', 'Frontend Usage', (content) => {
    const m = content.match(/(?:axios|fetch)\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/);
    if (m) return { method: m[1].toUpperCase(), route: m[2] };
    return null;
});

console.log(`Extracted ${apis.length} API definitions directly from source code.`);

let mdContent = `# Source Code API Reverse Engineering Report\n\n`;
mdContent += `This report lists API routes and usages extracted strictly from the actual source code (NestJS controllers, ERPNext \`@frappe.whitelist\`, Moodle \`db/services.php\`, and Frontend \`fetch/axios\` calls).\n\n`;
mdContent += `**Total APIs Found in Source:** ${apis.length}\n\n`;

mdContent += `| System | Method | Route | Source File |\n`;
mdContent += `|---|---|---|---|\n`;

const displayApis = apis.slice(0, 1500);

for (const api of displayApis) {
    const safeFile = api.file.replace('./', '');
    const safeRoute = api.route.substring(0, 80).replace(/\|/g, '\\|');
    mdContent += `| ${api.system} | ${api.method} | \`${safeRoute}\` | \`${safeFile}\` |\n`;
}

if (apis.length > 1500) {
    mdContent += `\n*(Table truncated to 1500 records to maintain performance. ${apis.length - 1500} more APIs were extracted in the raw run.)*\n`;
}

fs.writeFileSync('Source_Code_API_Report.md', mdContent);
console.log('Successfully wrote Source_Code_API_Report.md');

