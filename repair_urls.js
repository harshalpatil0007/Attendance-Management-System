const fs = require('fs');
const path = require('path');

const rootDir = '.';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(rootDir, 'frontend/src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix nested imports like "import { \nimport { ... } from '...';"
    const nestedImportRegex = /import {\s*\n\s*import \{ (API_BASE_URL|BASE_URL|API_BASE_URL, BASE_URL) \} from '(.*)';/g;
    if (nestedImportRegex.test(content)) {
        content = content.replace(nestedImportRegex, "import { $1 } from '$2';\nimport {");
        modified = true;
    }

    // Fix literal strings that should be template literals: '${API_BASE_URL}...' -> `${API_BASE_URL}...`
    const apiBaseUrlStringRegex = /'\${API_BASE_URL}(.*?)'/g;
    if (apiBaseUrlStringRegex.test(content)) {
        content = content.replace(apiBaseUrlStringRegex, "`\${API_BASE_URL}$1` ");
        modified = true;
    }

    const baseUrlStringRegex = /'\${BASE_URL}(.*?)'/g;
    if (baseUrlStringRegex.test(content)) {
        content = content.replace(baseUrlStringRegex, "`\${BASE_URL}$1` ");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Repaired: ${file}`);
    }
});
