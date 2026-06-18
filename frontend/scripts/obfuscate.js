import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const assetsDir = path.join(process.cwd(), 'dist/assets');

try {
  if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory does not exist: ${assetsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  if (jsFiles.length === 0) {
    console.warn('No JS files found to obfuscate.');
    process.exit(0);
  }

  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    console.log(`Obfuscating ${filePath}...`);
    const originalCode = fs.readFileSync(filePath, 'utf8');

    // Run obfuscator with optimal protection configurations
    const obfuscationResult = JavaScriptObfuscator.obfuscate(originalCode, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: false, // Turn off for mobile bundle size performance
      debugProtection: false, // Turn off to prevent app crash in some WebViews
      disableConsoleOutput: false,
      numbersToExpressions: true,
      simplify: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      splitStrings: true,
      splitStringsChunkLength: 10,
      unicodeEscapeSequence: false
    });

    fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode(), 'utf8');
    console.log(`Obfuscation complete for ${file}!`);
  });

  console.log('All JavaScript files successfully obfuscated!');
} catch (error) {
  console.error('Error during JS obfuscation:', error);
  process.exit(1);
}
