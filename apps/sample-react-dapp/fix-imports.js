const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in the packages
const files = glob.sync([
  'packages/*/src/**/*.ts',
  'packages/*/src/**/*.tsx'
]);

const originals = {};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  originals[file] = content;
  
  // Replace .js extensions in import statements
  const newContent = content.replace(
    /from ['"]([^'"]+)\.js['"]/g, 
    'from "$1"'
  );
  
  if (content !== newContent) {
    console.log(`Fixing imports in: ${file}`);
    fs.writeFileSync(file, newContent);
  }
});

// Function to restore files to their original state
function restoreFiles() {
  console.log('Restoring original files...');
  Object.entries(originals).forEach(([file, content]) => {
    fs.writeFileSync(file, content);
  });
}

// Register cleanup for exit and signals
process.on('exit', restoreFiles);
process.on('SIGINT', () => {
  restoreFiles();
  process.exit();
});
process.on('SIGTERM', () => {
  restoreFiles();
  process.exit();
});