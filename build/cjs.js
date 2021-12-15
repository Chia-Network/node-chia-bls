const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src');
const internal = path.join(src, 'internal.ts');
const content = fs
    .readFileSync(internal, 'utf-8')
    .trim()
    .matchAll(/export\s*\*\s*from\s*'(\..*?)';?/g);

const files = [];
const imports = [];

for (const file of content) {
    const content = fs
        .readFileSync(path.join(src, file[1].replace(/\.js$/g, '.ts')), 'utf-8')
        .replace(
            /import\s*(.*?\s*,\s*)?\{([^]*?)\}\s*from\s*'(.*?)';?/g,
            (_, moduleImport, namedImports, moduleName) => {
                if (moduleName.startsWith('.')) return '';
                if (
                    moduleImport &&
                    imports.findIndex((item) => item.name === moduleImport) ===
                        -1
                )
                    imports.push({
                        module: true,
                        name: moduleImport,
                        file: moduleName,
                    });
                for (const namedImport of namedImports
                    .replace(/,\s*$/, '')
                    .trim()
                    .split(/\s*,\s*/)) {
                    const sides = namedImport
                        .split(' as ')
                        .map((side) => side.trim());
                    const target = sides[0];
                    let name = target;
                    if (sides.length > 1) name = sides[1];
                    if (imports.findIndex((item) => item.name === name) === -1)
                        imports.push({
                            module: false,
                            name,
                            target,
                            file: moduleName,
                        });
                }
            }
        );
    files.push(content);
}

const importsByFile = {};
for (const item of imports) {
    if (!(item.file in importsByFile)) importsByFile[item.file] = [];
    importsByFile[item.file].push(item);
}

const importLines = [];
for (const [file, items] of Object.entries(importsByFile)) {
    const moduleItem = items.find((item) => item.module);
    const content = [];
    if (moduleItem) content += moduleItem.name;
    const targets = [];
    for (const item of items.filter((item) => !item.module))
        targets.push(
            `${item.target}${
                item.name !== item.target ? ` as ${item.name}` : ''
            }`
        );
    if (targets.length) content.push(`{ ${targets.join(', ')} }`);
    importLines.push(
        `import ${content.join(', ')} from ${JSON.stringify(file)}`
    );
}

fs.writeFileSync(
    path.join(__dirname, 'src', 'index.ts'),
    [importLines.join('\n'), ...files].join('\n\n'),
    'utf-8'
);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

fs.writeFileSync(
    path.join(__dirname, 'dist', 'package.json'),
    `
{
    "type": "commonjs"
}
`.trim(),
    'utf-8'
);
