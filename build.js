const fs = require('fs');
const path = require('path');

const files = [
  'src_app/head.html',
  'src_app/firebase_service.js',
  'src_app/icons.js',
  'src_app/constants_and_helpers.js',
  'src_app/ocr_modal.js',
  'src_app/accounts_view.js',
  'src_app/debts_view.js',
  'src_app/goals_budget_view.js',
  'src_app/ai_widget.js',
  'src_app/security_components.js',
  'src_app/charts_and_tables.js',
  'src_app/transaction_modal.js',
  'src_app/app_main.js'
];

let finalHtml = '';
for (const f of files) {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File ${filePath} not found`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  finalHtml += content + '\n\n';
}

const outputPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outputPath, finalHtml, 'utf8');
console.log(`Successfully built ${outputPath} (${finalHtml.length} bytes, ${finalHtml.split('\n').length} lines)`);
