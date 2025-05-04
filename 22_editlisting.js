const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Edit Listing Test', function () {
  this.timeout(20000);

  let driver;
  let testUser;

  before(async () => {
    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));
    
    const options = new chrome.Options();
    options.addArguments('--force-device-scale-factor=0.1');  // 10% zoom

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
    }
  });

  it('edits a listing', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.get('http://localhost:5072/Dashboard');
    console.log('Navigated to dashboard');

    // Step 2: Navigate to the MyListings page
    await driver.get('http://localhost:5072/Listings/MyListings');
    console.log('Navigated to MyListings page');

    // Wait for the table to load (adjust selector as needed)
    const firstRow = await driver.wait(
        until.elementLocated(By.css('tbody tr')),
        5000
    );

    // Find the status dropdown button within that row
    const statusButton = await firstRow.findElement(By.css('.dropdown .status-btn'));

    // Click the button to open the dropdown
    await statusButton.click();
    console.log('Opened status dropdown for first row');

    // Wait for one of the dropdown options to appear
    const firstOption = await driver.wait(
        until.elementLocated(By.css('.dropdown-menu.status-menu .dropdown-item')),
        3000
    );

    // Click "Closed"
    const activeOption = await driver.findElement(By.css('.dropdown-menu .status-option[data-status="CLOSED"]'));
    await activeOption.click();
    console.log('Selected CLOSED status');
    
    // Refresh to update to table
    await driver.navigate().refresh();

    // Re-locate the first row
    const updatedFirstRow = await driver.findElement(By.css('tbody tr'));

    // Get the updated status text
    const updatedStatusSpan = await updatedFirstRow.findElement(By.css('#currentStatus'));
    const updatedStatus = await updatedStatusSpan.getText();
    console.log('Updated status:', updatedStatus);

    // Verify it matches expected value
    assert.strictEqual(updatedStatus, 'CLOSED', 'Expected status to be updated to CLOSED');
    });
});