const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next') {
      findFiles(fullPath, pattern, files);
    } else if (pattern.test(item)) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, '../src');
const files = findFiles(srcDir, /\.(ts|tsx)$/);

let totalChanged = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  // Fix @/types" and @/types; patterns (imports without specific path)
  content = content.replace(/"@\/types"/g, '"@/shared/types"');
  content = content.replace(/'@\/types'/g, "'@/shared/types'");
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
    totalChanged++;
  }
}
console.log(`Total files updated: ${totalChanged}`);
