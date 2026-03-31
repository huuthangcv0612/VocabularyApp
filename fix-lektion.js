const fs = require('fs');
const path = require('path');

const files = ['A1.2.json', 'A2.1.json', 'A2.2.json', 'B1.json'];
const dataDir = 'c:\\Users\\Thang\\source\\repos\\VocabularyApp\\frontend\\public\\data';

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  console.log('Processing: ' + filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // First replace: 'lektion': 'number.0' -> 'lektion': 'Lektion number'
  content = content.replace(/"lektion":\s*"(\d+)\.0"/g, '"lektion": "Lektion $1"');
  
  // Second replace: 'lektion': 'number' -> 'lektion': 'Lektion number'
  // But skip if it already contains 'Lektion' or 'nan' or 'Kapitel'
  content = content.replace(/"lektion":\s*"(\d+)"/g, (match, num) => {
    return '"lektion": "Lektion ' + num + '"';
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Processed: ' + file);
});

console.log('\nDone!');
