const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('admin.html', 'utf8');

// Find the module script with try-catch
const lines = html.split('\n');
let inModuleScript = false;
let scriptStartLine = 0;
let braceStack = [];
let tryLineNumber = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find start of module script with try
    if (line.includes('<script type="module">') && lines[i+1] && lines[i+1].includes('try {')) {
        inModuleScript = true;
        scriptStartLine = i + 1;
        tryLineNumber = i + 2;
        console.log(`Module script starts at line ${scriptStartLine}`);
        continue;
    }

    if (inModuleScript) {
        // Track braces
        for (let char of line) {
            if (char === '{') {
                braceStack.push({ line: i + 1, char: '{' });
            } else if (char === '}') {
                if (braceStack.length > 0) {
                    braceStack.pop();
                } else {
                    console.log(`ERROR: Unexpected closing brace at line ${i + 1}`);
                }
            }
        }

        // Check for the catch block
        if (line.includes('} catch (err)')) {
            console.log(`Found module catch at line ${i + 1}`);
            console.log(`Brace stack depth at catch: ${braceStack.length}`);

            if (braceStack.length > 0) {
                console.log('\n❌ ERROR: Try block not properly closed before catch!');
                console.log(`Missing ${braceStack.length} closing brace(s)`);
                console.log('\nUnclosed braces from lines:');
                braceStack.forEach(b => {
                    console.log(`  Line ${b.line}`);
                });
            }
            break;
        }

        // End of script
        if (line.includes('</script>')) {
            console.log(`Script ends at line ${i + 1}`);
            break;
        }
    }
}

// Look for specific problem areas
console.log('\n=== Looking for function definitions that might be missing closing braces ===');

// Find all function definitions in the module script
let moduleScriptContent = '';
let inModule = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<script type="module">') && lines[i+1] && lines[i+1].includes('try {')) {
        inModule = true;
        continue;
    }
    if (inModule && lines[i].includes('</script>')) {
        break;
    }
    if (inModule) {
        moduleScriptContent += lines[i] + '\n';
    }
}

// Find functions that might be missing semicolons or braces
const functionPattern = /window\.(\w+)\s*=\s*(async\s+)?function/g;
let match;
const functions = [];

while ((match = functionPattern.exec(moduleScriptContent)) !== null) {
    const lineNum = moduleScriptContent.substring(0, match.index).split('\n').length;
    functions.push({
        name: match[1],
        lineInScript: lineNum,
        fullMatch: match[0]
    });
}

console.log(`\nFound ${functions.length} window function assignments in module script`);

// Check last few functions for potential issues
console.log('\nLast 5 functions defined:');
functions.slice(-5).forEach(f => {
    console.log(`  ${f.name} at script line ~${f.lineInScript}`);
});