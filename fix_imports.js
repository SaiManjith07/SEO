const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // regex to find: import { x } from './some/path'; (missing .js)
      // replace with: import { x } from './some/path.js';
      // only relative imports starting with '.' or '..'
      let updated = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
        if (!p1.endsWith('.js') && !p1.endsWith('.json')) {
          return `from '${p1}.js'`;
        }
        return match;
      });

      // also handle export * from './some/path';
      updated = updated.replace(/export\s+([^'"]*?)\s*from\s+['"](\.[^'"]+)['"]/g, (match, p1, p2) => {
        if (!p2.endsWith('.js') && !p2.endsWith('.json')) {
          return `export ${p1} from '${p2}.js'`;
        }
        return match;
      });

      // simple export { x } from './y'
      updated = updated.replace(/export\s+\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g, (match, p1, p2) => {
        if (!p2.endsWith('.js') && !p2.endsWith('.json')) {
          return `export {${p1}} from '${p2}.js'`;
        }
        return match;
      });

      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'seokit/packages/core/src'));
