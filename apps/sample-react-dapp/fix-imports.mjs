import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { glob } from 'glob';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all TypeScript files in the packages
const files = await glob([
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

console.log('Import paths fixed temporarily. Run your build now.');