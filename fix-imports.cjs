const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./components').concat(walk('./services')).concat(['./MainApp.tsx', './index.tsx']);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import * as React from 'react'")) {
    content = content.replace(/import \* as React from 'react'/g, "import React from 'react'");
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
