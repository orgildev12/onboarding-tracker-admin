'use strict';

const fs = require('node:fs');
const path = require('node:path');

function syncTailwindStyles() {
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'tailwind.generated.css');
  const outputPath = path.join(root, 'src', 'webparts', 'onboardingTracker', 'tailwind.styles.ts');

  if (!fs.existsSync(cssPath)) {
    throw new Error(`Generated Tailwind CSS not found: ${cssPath}`);
  }

  const css = fs.readFileSync(cssPath, 'utf8');
  const generatedModule = `export const tailwindStyles: string = ${JSON.stringify(css)};\n`;
  fs.writeFileSync(outputPath, generatedModule);
}

if (require.main === module) {
  syncTailwindStyles();
}

module.exports = { syncTailwindStyles };
