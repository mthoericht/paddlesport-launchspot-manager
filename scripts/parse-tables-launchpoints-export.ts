import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the raw PDF data JSON file (default: launchpoint-tables-export.json in external-data-preset)
const args = process.argv.slice(2);
const rawDataPath = args.length > 0
  ? (path.isAbsolute(args[0]) ? args[0] : path.join(__dirname, '..', args[0]))
  : path.join(__dirname, 'external-data-preset', 'launchpoint-tables-export.json');

// Load raw PDF data from JSON file
interface RawPdfEntry {
  betreiber: string;
  anleger: string;
  strasse: string;
  plz: string;
  ort: string;
  gewaesser: string;
  km?: string;
  gastliegeplaetze?: string;
  internet?: string;
  telefon?: string;
}

let pdfData: RawPdfEntry[] = [];

// Load data from JSON file
if (!fs.existsSync(rawDataPath))
{
  console.error(`❌ Error: Raw data file not found at ${rawDataPath}`);
  if (args.length === 0)
  {
    console.error('Using default path: scripts/external-data-preset/launchpoint-tables-export.json');
    console.error('💡 Tip: You can specify a custom input file:');
    console.error('   npm run parse:tables-launchpoints-export <input.json>');
  }
  else
  {
    console.error('Please ensure the specified file exists.');
  }
  process.exit(1);
}

if (args.length === 0)
{
  console.log('ℹ️  Using default input file: scripts/external-data-preset/launchpoint-tables-export.json');
  console.log('💡 Tip: You can specify a custom input file:');
  console.log('   npm run parse:tables-launchpoints-export <input.json>');
  console.log('');
}

try
{
  const rawDataContent = fs.readFileSync(rawDataPath, 'utf-8');
  pdfData = JSON.parse(rawDataContent) as RawPdfEntry[];
  console.log(`✓ Loaded ${pdfData.length} entries from ${rawDataPath}`);
}
catch (error: any)
{
  console.error(`❌ Error reading or parsing JSON file: ${error.message}`);
  process.exit(1);
}

interface GeocodeResult {
  lat: number;
  lon: number;
}

/**
 * Parse coordinates from string like "Koordinaten: 54°21'02.2"N; 9°30'46.0"E"
 */
function parseCoordinates(strasse: string): GeocodeResult | null
{
  // Check if strasse contains coordinates
  const coordMatch = strasse.match(/Koordinaten:\s*(\d+)°(\d+)'([\d.]+)"([NS]);\s*(\d+)°(\d+)'([\d.]+)"([EW])/i);
  
  if (coordMatch)
  {
    const latDeg = parseFloat(coordMatch[1]);
    const latMin = parseFloat(coordMatch[2]);
    const latSec = parseFloat(coordMatch[3]);
    const latDir = coordMatch[4].toUpperCase();
    
    const lonDeg = parseFloat(coordMatch[5]);
    const lonMin = parseFloat(coordMatch[6]);
    const lonSec = parseFloat(coordMatch[7]);
    const lonDir = coordMatch[8].toUpperCase();
    
    // Convert to decimal degrees
    let lat = latDeg + latMin / 60 + latSec / 3600;
    let lon = lonDeg + lonMin / 60 + lonSec / 3600;
    
    // Apply direction
    if (latDir === 'S') lat = -lat;
    if (lonDir === 'W') lon = -lon;
    
    return { lat, lon };
  }
  
  return null;
}

async function geocodeAddress(strasse: string, plz: string, ort: string, anleger?: string): Promise<GeocodeResult | null>
{
  // Build query string
  const addressParts: string[] = [];
  
  if (strasse && strasse.trim())
  {
    addressParts.push(strasse.trim());
  }
  if (plz && plz.trim())
  {
    addressParts.push(plz.trim());
  }
  if (ort && ort.trim())
  {
    addressParts.push(ort.trim());
  }
  
  if (addressParts.length === 0)
  {
    return null;
  }
  
  const query = addressParts.join(', ') + ', Deutschland';
  
  try
  {
    // Use Nominatim API (OpenStreetMap) - free, no API key required
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PaddlesportLaunchspotManager/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok)
    {
      console.error(`Geocoding failed for ${query}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0)
    {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  }
  catch (error)
  {
    console.error(`Error geocoding ${query}:`, error);
    return null;
  }
}

function generateName(betreiber: string, anleger: string, ort: string): string
{
  if (anleger && anleger.trim())
  {
    return `${anleger.trim()}, ${ort.trim()}`;
  }
  return `${betreiber.trim()}, ${ort.trim()}`;
}

async function main()
{
  if (pdfData.length === 0)
  {
    console.error('❌ No data to process. Please check the JSON file.');
    process.exit(1);
  }

  console.log(`\nProcessing ${pdfData.length} entries from PDF data...\n`);
  
  const results: any[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < pdfData.length; i++)
  {
    const entry = pdfData[i];
    const { strasse, plz, ort, anleger, betreiber, gewaesser, km, gastliegeplaetze } = entry;
    
    // Check if strasse contains coordinates
    let coords: GeocodeResult | null = null;
    
    if (strasse && strasse.includes('Koordinaten:'))
    {
      coords = parseCoordinates(strasse);
      if (coords)
      {
        console.log(`[${i + 1}/${pdfData.length}] Using coordinates from strasse field: ${coords.lat}, ${coords.lon}`);
      }
    }
    
    // If no coordinates found, try geocoding
    if (!coords)
    {
      // Try to geocode even with minimal information (at least need city or postal code)
      if (!plz && !ort && !anleger)
      {
        console.log(`[${i + 1}/${pdfData.length}] ⚠️  Skipping entry without sufficient location info: ${betreiber || 'Unknown'}`);
        failCount++;
        continue;
      }
      
      // Try geocoding with available information
      const geocodeQuery = `${strasse || ''}, ${plz || ''} ${ort || ''}`.trim();
      console.log(`[${i + 1}/${pdfData.length}] Geocoding: ${geocodeQuery || anleger || betreiber || 'Unknown'}`);
      coords = await geocodeAddress(strasse || '', plz || '', ort || '', anleger || '');
      
      // If geocoding failed, try with just city/postal code
      if (!coords && (plz || ort))
      {
        console.log(`[${i + 1}/${pdfData.length}] Retrying geocoding with city/postal code only...`);
        coords = await geocodeAddress('', plz || '', ort || '', '');
      }
    }
    
    if (coords)
    {
      const name = generateName(betreiber, anleger || '', ort || '');
      
      // Build hints from available information
      const hintsParts: string[] = [];
      if (betreiber) hintsParts.push(`Betreiber: ${betreiber}`);
      if (gewaesser) hintsParts.push(`Gewässer: ${gewaesser}`);
      if (km) hintsParts.push(`Kilometer: ${km}`);
      if (gastliegeplaetze) hintsParts.push(`Gastliegeplätze: ${gastliegeplaetze}`);
      
      const result = {
        name,
        latitude: coords.lat,
        longitude: coords.lon,
        isOfficial: true, // These are official imported locations
        hints: hintsParts.join('\n') || null,
        openingHours: '24h',
        parkingOptions: null,
        nearbyWaters: gewaesser || null,
        foodSupply: null,
        // Note: createdById will need to be set during import
        // categories: should be set based on gastliegeplaetze (Kanu = kajak category)
        address: {
          street: strasse || null,
          postalCode: plz || null,
          city: ort || null,
          country: 'Deutschland'
        },
        originalData: {
          betreiber,
          anleger: anleger || null,
          gewaesser,
          km: km || null,
          gastliegeplaetze
        }
      };
      
      results.push(result);
      successCount++;
      console.log(`  ✓ Found coordinates: ${coords.lat}, ${coords.lon}`);
    }
    else
    {
      console.log(`  ✗ Failed to geocode`);
      failCount++;
    }
    
    // Be polite to the API - wait 1 second between requests (Nominatim requires this)
    if (i < pdfData.length - 1)
    {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\nGeocoding complete:`);
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  console.log(`  📊 Total processed: ${pdfData.length}`);
  console.log(`  📈 Success rate: ${((successCount / pdfData.length) * 100).toFixed(1)}%`);
  
  // Write results to JSON file (in the same directory as input file)
  const inputDir = path.dirname(rawDataPath);
  // Use default output name: launchpoints-import-data.json
  const outputPath = path.join(inputDir, 'launchpoints-import-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  
  console.log(`\n✅ Results written to: ${outputPath}`);
  console.log(`   Total entries: ${results.length}`);
}

main().catch(console.error);

