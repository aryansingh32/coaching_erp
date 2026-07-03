const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', 'build', 'docs', '.github', 'public', '.next']);

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            if (!EXCLUDED_DIRS.has(file)) {
                walkDir(filepath, callback);
            }
        } else if (stats.isFile()) {
            callback(filepath);
        }
    }
}

const apis = [];
let currentController = '';

const nestControllerRegex = /@Controller\(['"]([^'"]+)['"]\)/;
const nestRouteRegex = /@(Get|Post|Put|Delete|Patch)\(['"]([^'"]*)['"]\)/g;
const nestRouteEmptyRegex = /@(Get|Post|Put|Delete|Patch)\(\)/g;

const expressRouteRegex = /\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;

const frappeWhitelistRegex = /@frappe\.whitelist/g;
const frappeMethodDefRegex = /def\s+([a-zA-Z0-9_]+)\(/;

const moodleWsRegex = /'classname'\s*=>\s*'([^']+)'|'methodname'\s*=>\s*'([^']+)'/g;

const frontendApiRegex = /(?:axios|fetch)\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;

console.log("Starting static analysis of actual source code for APIs...");

walkDir('./', (filepath) => {
    const ext = path.extname(filepath);
    
    // NestJS / Express / Frontend
    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
        const content = fs.readFileSync(filepath, 'utf-8');
        
        // NestJS
        if (content.includes('@Controller')) {
            const controllerMatch = content.match(nestControllerRegex);
            const baseRoute = controllerMatch ? controllerMatch[1] : '';
            
            const lines = content.split('\n');
            for (let i=0; i<lines.length; i++) {
                const line = lines[i];
                let match;
                while ((match = nestRouteRegex.exec(line)) !== null) {
                    const method = match[1].toUpperCase();
                    const subRoute = match[2];
                    apis.push({ system: 'NestJS/Custom', file: filepath, method, route: `/${baseRoute}/${subRoute}`.replace('//','/') });
                }
                while ((match = nestRouteEmptyRegex.exec(line)) !== null) {
                    const method = match[1].toUpperCase();
                    apis.push({ system: 'NestJS/Custom', file: filepath, method, route: `/${baseRoute}`.replace('//','/') });
                }
            }
        }

        // Express
        let expressMatch;
        while ((expressMatch = expressRouteRegex.exec(content)) !== null) {
            apis.push({ system: 'Express', file: filepath, method: expressMatch[1].toUpperCase(), route: expressMatch[2] });
        }

        // Frontend Client usages
        let feMatch;
        while ((feMatch = frontendApiRegex.exec(content)) !== null) {
             apis.push({ system: 'Frontend Usage', file: filepath, method: 'API_CALL', route: feMatch[1] });
        }
    }

    // Python (Frappe/ERPNext)
    if (ext === '.py') {
        const content = fs.readFileSync(filepath, 'utf-8');
        if (content.includes('@frappe.whitelist')) {
            const lines = content.split('\n');
            let isWhitelisted = false;
            for (let i=0; i<lines.length; i++) {
                if (lines[i].includes('@frappe.whitelist')) {
                    isWhitelisted = true;
                    continue;
                }
                if (isWhitelisted) {
                    const defMatch = lines[i].match(frappeMethodDefRegex);
                    if (defMatch) {
                        // Example: api/method/app.module.doctype.file.method
                        apis.push({ system: 'ERPNext/Frappe', file: filepath, method: 'POST/GET', route: `/api/method/...${defMatch[1]}` });
                    }
                    isWhitelisted = false;
                }
            }
        }
    }

    // PHP (Moodle)
    if (ext === '.php' && filepath.includes('db/services.php')) {
        const content = fs.readFileSync(filepath, 'utf-8');
        let m;
        while ((m = moodleWsRegex.exec(content)) !== null) {
             const funcName = m[2] || m[1];
             if(funcName) {
                 apis.push({ system: 'Moodle', file: filepath, method: 'POST/GET', route: `webservice: ${funcName}` });
             }
        }
    }
});

console.log(`Extracted ${apis.length} API definitions directly from source code.`);

let mdContent = `# Comprehensive Source-Code API Report\n\n`;
mdContent += `This report lists API routes and usages extracted directly from the underlying source code files in this monorepo, avoiding documentation or tests. It statically analyzes NestJS controllers, Express routes, Frappe/ERPNext whitelisted methods, Moodle services, and Frontend fetch/axios calls.\n\n`;
mdContent += `**Total APIs Found in Source:** ${apis.length}\n\n`;

mdContent += `| System | Method | Route | Source File |\n`;
mdContent += `|---|---|---|---|\n`;

// Limit to first 1000 to avoid out-of-memory or excessively massive tables, though we can print all.
const displayApis = apis.slice(0, 1500);

for (const api of displayApis) {
    const safeFile = api.file.replace('./', '');
    mdContent += `| ${api.system} | ${api.method} | \`${api.route.substring(0, 100)}\` | \`${safeFile}\` |\n`;
}

if (apis.length > 1500) {
    mdContent += `\n*(Table truncated to 1500 records. ${apis.length - 1500} more APIs were extracted.)*\n`;
}

fs.writeFileSync('Source_Code_API_Report.md', mdContent);
console.log('Successfully wrote Source_Code_API_Report.md');

