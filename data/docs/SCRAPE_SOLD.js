// Puppeteer script to scrape summary data from Texas housing market reports on rocket.com
// USAGE:
//   npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
//   node cities_in_texas_market_reports.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const readline = require('readline');

const cityNames = [
  "Dallas","Houston","San Antonio","Austin","Fort Worth","El Paso","McAllen","Denton","Arlington","Corpus Christi","Plano","Lubbock","Laredo","Killeen","Irving","Garland","McKinney","Brownsville","College Station","Amarillo","Grand Prairie","Waco","Frisco","Port Arthur","Pasadena","Beaumont","Odessa","Midland","Mesquite","Tyler","Harlingen","Carrollton","Round Rock","Pearland","Richardson","Abilene","Texas City","The Woodlands","Lewisville","League City","Temple","Allen","Longview","San Angelo","Wichita Falls","Edinburg","Sugar Land","Mission","Conroe","Bryan","Texarkana","Pharr","New Braunfels","Baytown","Flower Mound","Lake Jackson","Cedar Park","Atascocita","Missouri City","San Marcos","Georgetown","North Richland Hills","Mansfield","Victoria","Sherman","Pflugerville","Rowlett","Spring","Euless","Eagle Pass","Grapevine","DeSoto","Wylie","Bedford","Leander","Cedar Hill","Rio Grande City","Keller","Galveston","Little Elm","Burleson","Lufkin","Del Rio","Haltom City","Rockwall","Kyle","The Colony","Weatherford","Coppell","Channelview","Weslaco","Schertz","Friendswood","Huntsville","Duncanville","Lancaster","Hurst","Mission Bend","Rosenberg","Forney"
];

function toUrlSlug(city) {
  return city.toLowerCase().replace(/\s+/g, '-');
}

const cities = cityNames.map(name => ({
  name,
  url: `https://rocket.com/homes/market-reports/tx/${toUrlSlug(name)}`
}));

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractSoldPendingSummary(page) {
  // Extract both total_sold_pending and sold numbers from the entire page text
  return await page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ');
    let total_sold_pending = 'N/A';
    let sold = 'N/A';
    let sold_raw_chunk = null; // To store the 100-char chunk if needed

    // Try matching the summary sentence with robust regex (handles punctuation, whitespace, and order)
    const summaryMatch = text.match(/A total of ([\d,]+) homes were sold or pending in [^.]+\. *Of the ([\d,]+) sold homes,/i);
    if (summaryMatch) {
      total_sold_pending = summaryMatch[1].replace(/,/g, '');
      sold = summaryMatch[2].replace(/,/g, '');
      return { total_sold_pending, sold, sold_raw_chunk };
    }

    // Try alternate phrasing (e.g., 'Of the X sold homes' comes before 'A total of Y homes...')
    const altMatch = text.match(/Of the ([\d,]+) sold homes,[^.]+\. *A total of ([\d,]+) homes were sold or pending in [^.]+\./i);
    if (altMatch) {
      total_sold_pending = altMatch[2].replace(/,/g, '');
      sold = altMatch[1].replace(/,/g, '');
      return { total_sold_pending, sold, sold_raw_chunk };
    }

    // Fallback: Try to find the first number first
    const firstMatch = text.match(/A total of ([\d,]+) homes were sold or pending in [^.]+\./i);
    if (firstMatch) {
      total_sold_pending = firstMatch[1].replace(/,/g, '');
      // Now try to find the second number *after* the first match
      const afterMatchIndex = text.indexOf(firstMatch[0]) + firstMatch[0].length;
      const nextChunk = text.substring(afterMatchIndex, afterMatchIndex + 100).trim(); // Trim whitespace
      const soldMatchInChunk = nextChunk.match(/Of the ([\d,]+) sold homes/i);
      if (soldMatchInChunk) {
        sold = soldMatchInChunk[1].replace(/,/g, '');
      } else {
        // *** MODIFICATION: Store the chunk if number not found ***
        sold = nextChunk; // Store the raw chunk
        sold_raw_chunk = nextChunk; // Also flag it
        console.warn(`Sold number not found via regex in fallback chunk for current city. Storing chunk: "${nextChunk}"`);
      }
      return { total_sold_pending, sold, sold_raw_chunk };
    }

    // If only the second number is present (less likely without the first part, but check anyway)
    const soldOnlyMatch = text.match(/Of the ([\d,]+) sold homes,/i);
    if (soldOnlyMatch) {
      // total_sold_pending remains 'N/A'
      sold = soldOnlyMatch[1].replace(/,/g, '');
      return { total_sold_pending, sold, sold_raw_chunk };
    }

    // Log for debugging if nothing significantly matched
    console.error('ERROR: Could not find expected summary patterns for this city.');
    return null; // Indicate failure to find anything useful
  });
}



function waitForEnter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question('Press Enter to continue to the next city...', () => {
    rl.close();
    resolve();
  }));
}

async function askMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('Run in (a)utomatic or (m)anual mode? [a]: ', answer => {
      rl.close();
      const mode = answer.trim().toLowerCase();
      if (mode === 'm' || mode === 'manual') return resolve('manual');
      return resolve('automatic'); // Default to automatic
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // headless: false helps bypass bot detection
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
  const fs = require('fs');
  const mode = await askMode();

  // *** MODIFICATION: Changed CSV filename and header ***
  const csvPath = 'scraped_sold.csv'; // More general name
  const csvHeader = 'CITY,TOTAL,PENDING,SOLD\n';

  // Write header only if file doesn't exist
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, csvHeader);
  }

  for (const city of cities) {
    console.log(`\nProcessing ${city.name}...`);
    let summaryData = null;
    let attempt = 0;
    const maxAttempts = 2; // Retry once on failure

    while (attempt < maxAttempts && !summaryData) {
        attempt++;
        if (attempt > 1) {
            console.log(`Retrying ${city.name} (Attempt ${attempt})...`);
            await delay(3000); // Wait before retry
        }
        try {
            await page.goto(city.url, { waitUntil: 'domcontentloaded', timeout: 30000 }); // domcontentloaded is often faster

            if (mode === 'manual') {
                console.log(`Loaded page for ${city.name}. Press Enter to continue scrape...`);
                await waitForEnter(); // User verifies page loaded
                await delay(1000); // Short delay after manual confirmation
            } else {
                 // Wait longer in automatic mode for dynamic content potentially
                 // Consider 'networkidle2' or 'networkidle0' if content loads late, but they take longer.
                 await delay(5000); // Wait 5 seconds after load
            }

            summaryData = await extractSoldPendingSummary(page);

        } catch (e) {
            console.error(`ERROR processing ${city.name} (Attempt ${attempt}): ${e.message}`);
            if (e.name === 'TimeoutError') {
                console.log(`Page timed out for ${city.name}.`);
            }
            summaryData = null; // Ensure summaryData is null on error
        }
    } // End retry loop


    if (summaryData) {
      // *** MODIFICATION: Calculate Pending and format output row ***
      const total_str = summaryData.total_sold_pending;
      const sold_str = summaryData.sold;
      const raw_chunk = summaryData.sold_raw_chunk; // Get the raw chunk if it exists

      let total_val = NaN;
      let sold_val = NaN;
      let pending_val_str = 'N/A'; // Default pending value
      let sold_output_str = sold_str; // Default sold output

      // Try to parse numbers for calculation
      if (total_str !== 'N/A') {
        total_val = parseInt(total_str, 10);
      }
      // Only parse sold if it wasn't the raw chunk
      if (sold_str !== 'N/A' && raw_chunk === null) {
         sold_val = parseInt(sold_str, 10);
      }

      // Calculate pending only if both numbers were successfully parsed
      if (!isNaN(total_val) && !isNaN(sold_val)) {
        pending_val_str = (total_val - sold_val).toString();
      }

      // Use the raw chunk for the SOLD column if it exists
      if (raw_chunk !== null) {
          sold_output_str = raw_chunk; // Use the stored chunk for output
          console.warn(`Using raw chunk for SOLD column for ${city.name}. Pending calculation might be 'N/A'.`);
      } else if (isNaN(sold_val)) {
          sold_output_str = 'N/A'; // Ensure SOLD is 'N/A' if parsing failed and it wasn't a chunk
      } else {
          sold_output_str = sold_val.toString(); // Use the parsed number string
      }


      // Prepare row for CSV: CITY, TOTAL, PENDING, SOLD
      const row = [
        city.name,
        isNaN(total_val) ? 'N/A' : total_val.toString(), // Ensure TOTAL is N/A if parsing failed
        pending_val_str,
        sold_output_str // This is either the parsed number, 'N/A', or the raw chunk
      ];

      // Escape quotes for CSV
      const csvLine = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
      fs.appendFileSync(csvPath, csvLine);
      console.log(`Wrote data for ${city.name} to ${csvPath}`);

    } else {
      console.log(`No valid summary data found for ${city.name} after ${maxAttempts} attempts.`);
      // Write a row indicating failure
       const row = [city.name, 'SCRAPE_FAILED', 'SCRAPE_FAILED', 'SCRAPE_FAILED'];
       const csvLine = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
       fs.appendFileSync(csvPath, csvLine);
    }

    if (mode === 'manual') {
      await waitForEnter(); // Wait before proceeding to the next city in manual mode
    } else {
        await delay(1500); // Small delay between automatic requests
    }
  } // End city loop

  await browser.close();
  console.log(`\nScraping complete. Results saved to ${csvPath}`);
})();