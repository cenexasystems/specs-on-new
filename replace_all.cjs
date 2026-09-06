const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /Specson/gi, replacement: 'Specson' },
  { regex: /Specson/gi, replacement: 'Specson' },
  { regex: /Specson/gi, replacement: 'Specson' },
  { regex: /specson/gi, replacement: 'specson' },
  { regex: /specson/gi, replacement: 'specson' },
  { regex: /specson/gi, replacement: 'specson' },
  { regex: /specson/gi, replacement: 'specson' },
  { regex: /specson/gi, replacement: 'Specson' },
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walkDir(file));
      }
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(__dirname);
files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.sql') || file.endsWith('.md') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    replacements.forEach(({regex, replacement}) => {
      content = content.replace(regex, replacement);
    });
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
