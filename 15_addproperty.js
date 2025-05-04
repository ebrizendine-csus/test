const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Create Property Test', function () {
  this.timeout(30000);

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

  it('creates a new property and checks if it appears in the table', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    // Step 2: Navigate to Properties page
    await driver.get('http://localhost:5072/Properties/MyProperties');
    console.log('Navigated to Properties page');

    // Step 3: Open the "Add Property" modal
    const addButton = await driver.findElement(By.css('button[data-bs-target="#AddPropertyModal"]'));
    await driver.wait(until.elementIsVisible(addButton), 5000);
    await addButton.click();
    console.log('Opened Add Property modal');

    // Wait for modal to render
    const modal = await driver.wait(until.elementLocated(By.id('AddPropertyModal')), 5000);
    await driver.wait(until.elementIsVisible(modal), 5000);

    // Step 4: Fill out the Add Property form (adjust selectors based on your input IDs inside modal)
    const propertyData = {
      stateProvince: 'CA',
      city: 'Los Angeles',
      postal: '90001',
      street: '123 Test Lane',
      bed: '3',
      bath: '2',
      year: '2001',
      type: '9'
    };

    await driver.findElement(By.id('propertyStateProvince')).sendKeys(propertyData.stateProvince);
    await driver.findElement(By.id('propertyCity')).sendKeys(propertyData.city);
    await driver.findElement(By.id('propertyPostal')).sendKeys(propertyData.postal);
    await driver.findElement(By.id('propertyStreet')).sendKeys(propertyData.street);
    await driver.findElement(By.id('bedCount')).sendKeys(propertyData.bed);
    await driver.findElement(By.id('bathCount')).sendKeys(propertyData.bath);
    await driver.findElement(By.id('yearConstructed')).sendKeys(propertyData.year);
    const { Select } = require('selenium-webdriver/lib/select');
    const propertyTypeSelect = new Select(await driver.findElement(By.id('propertyType')));
    await propertyTypeSelect.selectByValue(propertyData.type);    

    console.log('Filled out Add Property form');

    // Step 5: Submit the form
    const submitBtn = await driver.findElement(By.css('#AddPropertyModal button[type="submit"]'));
    await submitBtn.click();
    console.log('Submitted property form');

    // Wait for redirect or table reload
    await driver.sleep(2000);
    await driver.get('http://localhost:5072/Properties/MyProperties');
    console.log('Reloaded Properties page to confirm addition');

    // Step 6: Verify the new property appears in the table
    const tableRows = await driver.findElements(By.css('tbody tr'));
    let propertyFound = false;

    for (const row of tableRows) {
      const cells = await row.findElements(By.css('td'));
      const rowText = await Promise.all(cells.map(cell => cell.getText()));
      if (
        rowText.includes(propertyData.stateProvince) &&
        rowText.includes(propertyData.city) &&
        rowText.includes(propertyData.postal) &&
        rowText.includes(propertyData.street)
      ) {
        propertyFound = true;
        break;
      }
    }

    assert(propertyFound, 'Newly added property should appear in the properties table');
    console.log('Verified property appears in the table');
  });
});
