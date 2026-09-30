const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptStart = html.indexOf('<script type="text/babel">');
const scriptEnd = html.lastIndexOf('</script>');

if (scriptStart === -1 || scriptEnd === -1) {
  console.error("Could not find script block");
  process.exit(1);
}

const jsCode = html.substring(scriptStart + '<script type="text/babel">'.length, scriptEnd);
console.log("Extracted JS code length:", jsCode.length);

// Check matching braces, brackets, parentheses
let braces = 0;
let brackets = 0;
let parens = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < jsCode.length; i++) {
  const c = jsCode[i];
  const prev = i > 0 ? jsCode[i - 1] : '';

  if (inString) {
    if (c === stringChar && prev !== '\\') {
      inString = false;
    }
  } else {
    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
    } else if (c === '{') braces++;
    else if (c === '}') braces--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;
    else if (c === '(') parens++;
    else if (c === ')') parens--;
  }
}

console.log(`Braces delta: ${braces}, Brackets delta: ${brackets}, Parens delta: ${parens}`);
if (braces !== 0 || brackets !== 0 || parens !== 0) {
  console.error("WARNING: Mismatched delimiters found!");
} else {
  console.log("Delimiters are perfectly balanced!");
}
