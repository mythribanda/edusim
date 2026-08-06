const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

// Helper to recursively list files
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

// 1. Get all files under src/
const allFiles = getFiles(srcDir);

// 2. Read contents of all files in src/ to search for imports/references
const fileContents = {};
allFiles.forEach(file => {
  try {
    fileContents[file] = fs.readFileSync(file, 'utf8');
  } catch (e) {
    // ignore binary files or read errors
  }
});

// We want to check all files, except key entries and route pages (since routes are auto-wired by TanStack Router)
const unusedFiles = [];

allFiles.forEach(file => {
  const relativePath = path.relative(srcDir, file);
  
  // Skip entrypoints and generated route tree
  if (
    relativePath === 'main.tsx' ||
    relativePath === 'App.tsx' ||
    relativePath === 'router.tsx' ||
    relativePath === 'routeTree.gen.ts'
  ) {
    return;
  }

  // Skip route files because they are registered implicitly in routeTree.gen.ts
  if (relativePath.startsWith('routes' + path.sep)) {
    return;
  }

  // Skip types/definition files if they are standard typings
  if (file.endsWith('.d.ts')) {
    return;
  }

  const extension = path.extname(file);
  const baseName = path.basename(file, extension);
  
  // If the baseName is generic like "index" or "utils", we have to check imports of the directory or relative path
  const parentDirName = path.basename(path.dirname(file));
  
  let isUsed = false;

  for (const otherFile of allFiles) {
    if (otherFile === file) continue;

    const content = fileContents[otherFile];
    if (!content) continue;

    // Check if the baseName is referenced in imports or requirements in the other file.
    // e.g. import MyComponent from './MyComponent' or import { MyComponent }
    // We check if the file content references the baseName as a word/import token.
    const importRegex = new RegExp(`\\b${baseName}\\b`);
    if (importRegex.test(content)) {
      isUsed = true;
      break;
    }

    // Also check relative import paths for "index" or directory imports
    if (baseName === 'index' || baseName === 'utils') {
      const dirImportRegex = new RegExp(`/${parentDirName}['"]`);
      if (dirImportRegex.test(content)) {
        isUsed = true;
        break;
      }
    }
  }

  if (!isUsed) {
    unusedFiles.push(relativePath);
  }
});

console.log('--- SCAN RESULTS: Potential Unused Files ---');
if (unusedFiles.length === 0) {
  console.log('No unused files found.');
} else {
  unusedFiles.forEach(file => {
    console.log(file);
  });
}
console.log('---------------------------------------------');
