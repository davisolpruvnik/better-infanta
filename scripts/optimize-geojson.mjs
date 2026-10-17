// scripts/optimize-geojson.mjs
import fs from 'node:fs';
import path from 'node:path';

// 📍 Adjust the path if your file is in a different directory
const TARGET_FILE = path.resolve('src/data/geog/turnout-map/infanta_hex_precincts.json');

if (!fs.existsSync(TARGET_FILE)) {
  console.error(`❌ File not found: ${TARGET_FILE}`);
  process.exit(1);
}

const originalSize = fs.statSync(TARGET_FILE).size;
const geojson = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf-8'));

// Recursively round coordinates to 4 decimal places
function truncateCoords(coords, decimals = 4) {
  if (!Array.isArray(coords)) return coords;
  if (typeof coords[0] === 'number') {
    return coords.map(n => Number(n.toFixed(decimals)));
  }
  return coords.map(c => truncateCoords(c, decimals));
}

if (geojson.features) {
  geojson.features.forEach(feature => {
    if (feature.geometry && feature.geometry.coordinates) {
      feature.geometry.coordinates = truncateCoords(feature.geometry.coordinates, 4);
    }
  });
}

// Write back MINIFIED (no indentation whitespace)
const minified = JSON.stringify(geojson);
fs.writeFileSync(TARGET_FILE, minified, 'utf-8');

const newSize = fs.statSync(TARGET_FILE).size;
const savedPercent = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

console.log(`✅ GeoJSON Optimized!`);
console.log(`   Before: ${(originalSize / 1024).toFixed(1)} KB`);
console.log(`   After:  ${(newSize / 1024).toFixed(1)} KB`);
console.log(`   Saved:  ${savedPercent}% 📉`);
