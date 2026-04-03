const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'products.json');
const backupPath = dataPath + '.bak.' + Date.now();

let s = fs.readFileSync(dataPath, 'utf8');
fs.writeFileSync(backupPath, s, 'utf8');
console.log('Backup created at', backupPath);

// Fix patterns like: http://localhost:5000https://res.cloudinary.com/...
s = s.replace(/http:\/\/localhost:5000https:\/\//g, 'https://');
s = s.replace(/http:\/\/localhost:5000http:\/\//g, 'http://');

// Fix patterns like: /uploads/https://...  or http://localhost:5000/uploads/https://...
s = s.replace(/(?:https?:\/\/localhost:5000)?\/?uploads\/(https?:\/\/)/g, '$1');

// Also strip accidental double host prefix like 'http://localhost:5000https://'
s = s.replace(/https?:\/\/localhost:5000/g, '');

// Write cleaned file
fs.writeFileSync(dataPath, s, 'utf8');
console.log('products.json cleaned and written.');

// Quick stats
const before = fs.readFileSync(backupPath, 'utf8').match(/localhost:5000|\/uploads\//g) || [];
const after = s.match(/localhost:5000|\/uploads\//g) || [];
console.log('Occurrences before:', before.length, 'after:', after.length);
