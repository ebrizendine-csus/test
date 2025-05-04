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
    options.addArguments('--force-device-scale-factor=0.5');  // 10% zoom       
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
    }
  });

  it('creates a new person and property, then checks if they appear in their respective tables', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    // Step 2: Navigate to People page and create a new person
    await driver.get('http://localhost:5072/People/CreatePerson');
    console.log('Navigated to Create Person page');

    // Wait for the form to be present
    await driver.wait(until.elementLocated(By.css('form.form-group')), 5000);

    // Fill out the Create Person form with the logged-in user's information
    await driver.findElement(By.id('Person_NameFirst')).sendKeys(testUser.firstName || 'Test');
    await driver.findElement(By.id('Person_NameMiddle')).sendKeys(testUser.middleName || 'M');
    await driver.findElement(By.id('Person_NameLast')).sendKeys(testUser.lastName || 'User');
    await driver.findElement(By.id('Person_NameDisplay')).sendKeys(testUser.displayName || 'Test User');
    await driver.findElement(By.id('Person_Headline')).sendKeys('Test User Account');
    await driver.findElement(By.id('Person_EmailPrimary')).sendKeys(testUser.email);
    await driver.findElement(By.id('Person_EmailSecondary')).sendKeys(testUser.email);
    await driver.findElement(By.id('Person_EmailPrimaryLabel')).sendKeys('Primary');
    await driver.findElement(By.id('Person_EmailSecondaryLabel')).sendKeys('Secondary');
    await driver.findElement(By.id('Person_PhonePrimary')).sendKeys('1234567890');
    await driver.findElement(By.id('Person_PhoneSecondary')).sendKeys('0987654321');
    await driver.findElement(By.id('Person_PhonePrimaryLabel')).sendKeys('Primary');
    await driver.findElement(By.id('Person_PhoneSecondaryLabel')).sendKeys('Secondary');
    await driver.findElement(By.id('Person_Street')).sendKeys('123 Test St');
    await driver.findElement(By.id('Person_City')).sendKeys('Test City');
    await driver.findElement(By.id('Person_StateProvince')).sendKeys('TS');
    await driver.findElement(By.id('Person_Postal')).sendKeys('12345');
    await driver.findElement(By.id('Person_Country')).sendKeys('Test Country');
    await driver.findElement(By.id('Person_Comments')).sendKeys('Created by automated test');

    // Submit the Create Person form
    await driver.findElement(By.css('button[type="submit"].btn.btn-primary')).click();
    console.log('Created new person');

    // Wait for redirect after person creation
    await driver.wait(until.urlContains('/People/People'), 5000);

    // Step 3: Navigate to Properties page
    await driver.get('http://localhost:5072/Properties/MyProperties');
    console.log('Navigated to Properties page');

    // Step 4: Open the "Add Property" modal
    const addButton = await driver.wait(until.elementLocated(By.css('.gradient-button')), 5000);
    await driver.wait(until.elementIsVisible(addButton), 5000);
    await addButton.click();
    console.log('Opened Add Property modal');

    // Wait for modal to render
    const modal = await driver.wait(until.elementLocated(By.id('AddPropertyModal')), 5000);
    await driver.wait(until.elementIsVisible(modal), 5000);

    // Step 5: Fill out the Add Property form
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

    // Step 6: Submit the form
    const submitBtn = await driver.findElement(By.css('#AddPropertyModal button[type="submit"]'));
    await submitBtn.click();
    console.log('Submitted property form');

    // Wait for redirect or table reload
    await driver.sleep(2000);
    await driver.get('http://localhost:5072/Properties/MyProperties');
    console.log('Reloaded Properties page to confirm addition');

    // Step 7: Verify the new property appears in the table
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

    // Step 8: Navigate to Dashboard and verify property appears in Latest properties widget
    await driver.get('http://localhost:5072/Dashboard');
    console.log('Navigated to Dashboard');

    // Wait for the Latest properties widget to load
    // First find the widget container
    const widgets = await driver.findElements(By.css('.widget'));
    let latestPropertiesWidget = null;
    
    for (const widget of widgets) {
      const headerText = await widget.findElement(By.css('h5')).getText();
      if (headerText.includes('Latest properties')) {
        latestPropertiesWidget = widget;
        break;
      }
    }

    if (!latestPropertiesWidget) {
      throw new Error('Latest properties widget not found on dashboard');
    }

    // Wait for the widget to be visible
    await driver.wait(until.elementIsVisible(latestPropertiesWidget), 5000);

    // Find all property items in the widget
    const propertyItems = await latestPropertiesWidget.findElements(By.css('.property-item'));
    let propertyFoundInDashboard = false;

    for (const item of propertyItems) {
      const propertyInfo = await item.findElement(By.css('.property-info'));
      const propertyText = await propertyInfo.getText();
      
      if (
        propertyText.includes(propertyData.street) &&
        propertyText.includes(propertyData.city) &&
        propertyText.includes(propertyData.stateProvince) &&
        propertyText.includes(propertyData.postal)
      ) {
        propertyFoundInDashboard = true;
        break;
      }
    }

    assert(propertyFoundInDashboard, 'Newly added property should appear in the Latest properties widget on the dashboard');
    console.log('Verified property appears in the dashboard widget');
  });
}); 