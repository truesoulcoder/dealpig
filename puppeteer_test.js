const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`Console message: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.error(`Page error: ${error.message}`);
  });

  // Navigate to the web app
  await page.goto('http://localhost:3000/leads');

  // Interact with the page
  await page.click('button#upload-button'); // Example button click
  
  // Fill out a form
  const fileInput = await page.$('input[type=file]');
  await fileInput.uploadFile('c:/Users/egolu/OneDrive/Documents/gh/dealpig/data/csvleads/raw/dallas_houses_90dom_0.65arv_cashoffer.csv');

  // Submit the form
  await page.click('button#submit-button');

  // Wait for a response or navigation
  await page.waitForNavigation();

  // Check for success message
  const successMessage = await page.$eval('.success-message', el => el.textContent);
  console.log(successMessage);

  await browser.close();
})();
