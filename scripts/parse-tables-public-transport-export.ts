import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple CSV parser that handles quoted fields and commas
 */
function parseCSV(csvContent: string): string[][] 
{
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) 
  {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];
    
    if (char === '"') 
    {
      if (inQuotes && nextChar === '"') 
      {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      }
      else 
      {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    }
    else if (char === ',' && !inQuotes) 
    {
      // Field separator
      currentLine.push(currentField.trim());
      currentField = '';
    }
    else if ((char === '\n' || char === '\r') && !inQuotes) 
    {
      // Line separator
      if (currentField || currentLine.length > 0) 
      {
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field.length > 0)) 
        {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      }
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') 
      {
        i++;
      }
    }
    else 
    {
      currentField += char;
    }
  }
  
  // Handle last field/line
  if (currentField || currentLine.length > 0) 
  {
    currentLine.push(currentField.trim());
    if (currentLine.some(field => field.length > 0)) 
    {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

interface PublicTransportStationData {
  name: string;
  latitude: number;
  longitude: number;
  types: string[];
  lines: string[];
}

/**
 * Convert CSV to JSON format for public transport stations
 */
function csvToJson(csvPath: string, outputPath: string): void 
{
  if (!fs.existsSync(csvPath)) 
  {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = parseCSV(csvContent);
  
  if (lines.length === 0) 
  {
    console.error('❌ Error: CSV file is empty');
    process.exit(1);
  }
  
  // First line should be headers
  const headers = lines[0].map(h => h.trim().toLowerCase());
  console.log(`✓ Found headers: ${headers.join(', ')}`);
  
  // Validate headers
  const requiredHeaders = ['name', 'latitude', 'longitude', 'types', 'lines'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) 
  {
    console.error(`❌ Error: Missing required headers: ${missingHeaders.join(', ')}`);
    console.error(`   Found headers: ${headers.join(', ')}`);
    process.exit(1);
  }
  
  // Get column indices
  const nameIndex = headers.indexOf('name');
  const latIndex = headers.indexOf('latitude');
  const lonIndex = headers.indexOf('longitude');
  const typesIndex = headers.indexOf('types');
  const linesIndex = headers.indexOf('lines');
  
  // Convert rows to objects
  const jsonData: PublicTransportStationData[] = [];
  let skippedRows = 0;
  let errorRows = 0;
  
  for (let i = 1; i < lines.length; i++) 
  {
    const row = lines[i];
    
    // Skip empty rows
    if (row.every(cell => !cell || cell.trim() === '')) 
    {
      skippedRows++;
      continue;
    }
    
    try 
    {
      const name = row[nameIndex]?.trim() || '';
      const latitude = parseFloat(row[latIndex]?.trim() || '');
      const longitude = parseFloat(row[lonIndex]?.trim() || '');
      const typesStr = row[typesIndex]?.trim() || '';
      const linesStr = row[linesIndex]?.trim() || '';
      
      // Validate required fields
      if (!name || isNaN(latitude) || isNaN(longitude)) 
      {
        console.warn(`⚠️  Skipping row ${i + 1}: Missing required fields (name, latitude, longitude)`);
        errorRows++;
        continue;
      }
      
      // Parse types (comma-separated, remove quotes)
      const types = typesStr
        .replace(/^"|"$/g, '') // Remove surrounding quotes
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      // Parse lines (comma-separated, remove quotes)
      const lines = linesStr
        .replace(/^"|"$/g, '') // Remove surrounding quotes
        .split(',')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      
      // Validate types (must be one of: train, tram, sbahn, ubahn)
      const validTypes = ['train', 'tram', 'sbahn', 'ubahn'];
      const invalidTypes = types.filter(t => !validTypes.includes(t));
      
      if (invalidTypes.length > 0) 
      {
        console.warn(`⚠️  Row ${i + 1} (${name}): Invalid types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`);
      }
      
      jsonData.push({
        name,
        latitude,
        longitude,
        types: types.filter(t => validTypes.includes(t)), // Only include valid types
        lines
      });
    }
    catch (error) 
    {
      console.warn(`⚠️  Error parsing row ${i + 1}:`, error);
      errorRows++;
    }
  }
  
  console.log(`✓ Processed ${jsonData.length} entries`);
  if (skippedRows > 0) 
  {
    console.log(`  ○ Skipped ${skippedRows} empty rows`);
  }
  if (errorRows > 0) 
  {
    console.log(`  ✗ ${errorRows} rows with errors`);
  }
  
  // Write JSON file
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`✅ JSON file written to: ${outputPath}`);
  console.log(`   Total entries: ${jsonData.length}`);
}

// Main execution
const args = process.argv.slice(2);

// Default paths: use berlin-public-transport.csv in external-data-preset directory
const defaultInputPath = path.join(__dirname, 'external-data-preset', 'berlin-public-transport.csv');
const defaultOutputPath = path.join(__dirname, 'external-data-preset', 'berlin-public-transport.json');

let inputPath: string;
let outputPath: string;

if (args.length === 0) 
{
  // Use default paths
  inputPath = defaultInputPath;
  outputPath = defaultOutputPath;
  console.log('ℹ️  Using default paths:');
  console.log(`   Input:  ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log('');
  console.log('💡 Tip: You can specify custom input and output paths:');
  console.log('   npm run parse:tables-public-transport-export <input.csv> [output.json]');
  console.log('');
}
else 
{
  // Use provided paths
  inputPath = path.isAbsolute(args[0]) 
    ? args[0] 
    : path.join(__dirname, '..', args[0]);

  outputPath = args[1]
    ? (path.isAbsolute(args[1]) ? args[1] : path.join(__dirname, '..', args[1]))
    : inputPath.replace(/\.csv$/i, '.json');
}

csvToJson(inputPath, outputPath);
