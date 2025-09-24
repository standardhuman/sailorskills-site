const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('admin.html', 'utf8');

// Find the module script (the one with try-catch)
const moduleScriptRegex = /<script type="module">\s*try \{[\s\S]*?\} catch[\s\S]*?<\/script>/;
const match = html.match(moduleScriptRegex);

if (!match) {
    console.log('Module script not found');
    process.exit(1);
}

const script = match[0];

// Count opening and closing braces
let openBraces = (script.match(/\{/g) || []).length;
let closeBraces = (script.match(/\}/g) || []).length;

console.log(`Opening braces: ${openBraces}`);
console.log(`Closing braces: ${closeBraces}`);
console.log(`Difference: ${openBraces - closeBraces}`);

// Check for try-catch structure
const hasTry = script.includes('try {');
const hasCatch = script.includes('} catch');

console.log(`\nHas 'try {': ${hasTry}`);
console.log(`Has '} catch': ${hasCatch}`);

// Find the position of try and catch
if (hasTry && hasCatch) {
    const tryIndex = script.indexOf('try {');
    const catchIndex = script.indexOf('} catch');
    console.log(`\nTry position: ${tryIndex}`);
    console.log(`Catch position: ${catchIndex}`);

    if (catchIndex < tryIndex) {
        console.log('\n❌ ERROR: catch appears before try!');
    }
}

// Check for common syntax errors
const doubleCloseBrace = script.match(/\}\s*\}/g);
if (doubleCloseBrace) {
    console.log(`\n⚠️  Found ${doubleCloseBrace.length} instances of double closing braces: }}`);
}