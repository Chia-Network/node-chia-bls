const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

fs.writeFileSync(
    path.join(__dirname, '..', 'dist', 'package.json'),
    `
{
    "type": "module"
}
`.trim(),
    'utf-8'
);
