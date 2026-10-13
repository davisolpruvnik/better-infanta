// scripts/optimize-font.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

// 1. Locate the heavy 917 KB raw font in node_modules
const inputPath = path.resolve(
  'node_modules/@fontsource-variable/google-sans-flex/files/google-sans-flex-latin-full-normal.woff2'
);
const outputPath = path.resolve('public/fonts/google-sans-flex-optimized.woff2');

console.log('⏳ Reading raw font file...');
const inputBuffer = await fs.readFile(inputPath);

// 2. Define characters for English and Filipino (including letters, numbers, punctuation, and Ñ/ñ)
const textToKeep =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789Ññ.,;:!?()[]{}/\\\'"@#$%^&*-+=_~`<>| ';

console.log('⚡ Subsetting glyphs and compressing via WebAssembly HarfBuzz...');
const optimizedBuffer = await subsetFont(inputBuffer, textToKeep, {
  targetFormat: 'woff2',
  // Preserves variable axes (opsz, wdth, wght) while dropping thousands of unneeded glyphs
});

// 3. Save the compressed file to public/fonts/
await fs.mkdir('public/fonts', { recursive: true });
await fs.writeFile(outputPath, optimizedBuffer);

const oldSizeKB = (inputBuffer.length / 1024).toFixed(1);
const newSizeKB = (optimizedBuffer.length / 1024).toFixed(1);

console.log(`✅ Done! Reduced from ${oldSizeKB} KB down to ${newSizeKB} KB!`);
console.log(`📁 Saved to: ${outputPath}`);
