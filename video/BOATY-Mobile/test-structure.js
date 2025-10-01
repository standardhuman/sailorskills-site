// Quick test to verify project structure
const fs = require('fs');
const path = require('path');

console.log('Testing BOATY Mobile Phase 1 Structure...\n');

const requiredFiles = [
  'App.js',
  'package.json',
  'src/navigation/AppNavigator.js',
  'src/screens/HomeScreen.js',
  'src/screens/GoProConnectScreen.js',
  'src/screens/VideoLibraryScreen.js',
  'src/screens/UploadQueueScreen.js',
  'src/screens/SettingsScreen.js',
  'src/services/VideoDatabase.js',
  'src/constants/Colors.js',
  'src/constants/Config.js'
];

let passed = 0;
let failed = 0;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    passed++;
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
    failed++;
  }
});

console.log(`\n${passed} files found, ${failed} missing`);
console.log(failed === 0 ? '\n✅ Phase 1 structure complete!' : '\n❌ Some files are missing');

process.exit(failed === 0 ? 0 : 1);