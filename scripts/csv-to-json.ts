import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple CSV parser that handles quoted fields and commas
 */
function parseCSV(csvContent: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Line separator
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      }
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }
  
  // Handle last field/line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(field => field.length > 0)) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

/**
 * Convert CSV to JSON format matching the expected structure
 */
function csvToJson(csvPath: string, outputPath: string): void {
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = parseCSV(csvContent);
  
  if (lines.length === 0) {
    console.error('❌ Error: CSV file is empty');
    process.exit(1);
  }
  
  // First line should be headers
  const headers = lines[0].map(h => h.trim().toLowerCase());
  console.log(`✓ Found headers: ${headers.join(', ')}`);
  
  // Map common header variations to expected field names
  const headerMap: Record<string, string> = {
    'betreiber': 'betreiber',
    'anleger': 'anleger',
    'strasse': 'strasse',
    'straße': 'strasse',
    'street': 'strasse',
    'plz': 'plz',
    'postalcode': 'plz',
    'postleitzahl': 'plz',
    'ort': 'ort',
    'city': 'ort',
    'stadt': 'ort',
    'gewaesser': 'gewaesser',
    'gewässer': 'gewaesser',
    'water': 'gewaesser',
    'km': 'km',
    'kilometer': 'km',
    'gastliegeplaetze': 'gastliegeplaetze',
    'gastliegeplätze': 'gastliegeplaetze',
    'internet': 'internet',
    'website': 'internet',
    'telefon': 'telefon',
    'phone': 'telefon',
    'tel': 'telefon'
  };
  
  // Normalize headers
  const normalizedHeaders = headers.map(h => {
    const key = Object.keys(headerMap).find(k => h.includes(k.toLowerCase()));
    return key ? headerMap[key] : h;
  });
  
  // Convert rows to objects
  const jsonData: any[] = [];
  let skippedRows = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    
    // Skip empty rows
    if (row.every(cell => !cell || cell.trim() === '')) {
      skippedRows++;
      continue;
    }
    
    const entry: any = {};
    normalizedHeaders.forEach((header, index) => {
      entry[header] = row[index] || '';
    });
    
    jsonData.push(entry);
  }
  
  console.log(`✓ Processed ${jsonData.length} entries (skipped ${skippedRows} empty rows)`);
  
  // Write JSON file
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`✅ JSON file written to: ${outputPath}`);
  console.log(`   Total entries: ${jsonData.length}`);
}

// Main execution
const args = process.argv.slice(2);

// Default paths: use tables-export.csv in external-data-preset directory
const defaultInputPath = path.join(__dirname, 'external-data-preset', 'tables-export.csv');
const defaultOutputPath = path.join(__dirname, 'external-data-preset', 'tables-export.json');

let inputPath: string;
let outputPath: string;

if (args.length === 0) {
  // Use default paths
  inputPath = defaultInputPath;
  outputPath = defaultOutputPath;
  console.log('ℹ️  Using default paths:');
  console.log(`   Input:  ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log('');
  console.log('💡 Tip: You can specify custom input and output paths:');
  console.log('   npm run csv:to-json <input.csv> [output.json]');
  console.log('');
} else {
  // Use provided paths
  inputPath = path.isAbsolute(args[0]) 
    ? args[0] 
    : path.join(__dirname, '..', args[0]);

  outputPath = args[1]
    ? (path.isAbsolute(args[1]) ? args[1] : path.join(__dirname, '..', args[1]))
    : inputPath.replace(/\.csv$/i, '.json');
}

csvToJson(inputPath, outputPath);

