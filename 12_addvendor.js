const { Builder, By } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Create Vendor Test', function () {
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

  it('creates a new vendor', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.get('http://localhost:5072/Dashboard');
    console.log('Navigated to dashboard');

    // Step 2: Navigate to Vendor page
    await driver.get('http://localhost:5072/Vendors/MyVendors');
    console.log('Navigated to Vendor page');

    // Step 3: Click on Add button to go to Create Person page
    const addButton = await driver.findElement(By.css('button.gradient-button'));
    await addButton.click();
    console.log('Clicked on Add button to go to Create Vendor page');

    await driver.get('http://localhost:5072/Vendors/CreateEntities');
    console.log('Navigated to Create Vendor page');

    // Step 4: Fill out Create Person form
    const vendorData = {
      businessName: 'Smith Realty',
      category: '1', // Use "1" for Broker, "2" for Contractor, "3" for Escrow (based on your enum mapping)
      phone: '123-456-7890',
      country: 'USA',
      stateProvince: 'CA',
      city: 'Sample City',
      postal: '12345',
      street: '123 Main St',
      website: 'https://smithrealty.com',
      doNotMarket: 'false', // "false" = Market? Yes
      doNotContact: 'false' // "false" = Contact? Yes
    };

    await driver.findElement(By.id('Entity_EntityName')).sendKeys(vendorData.businessName);
    await driver.findElement(By.id('Entity_Category')).sendKeys(vendorData.category);
    await driver.findElement(By.id('Entity_Phone')).sendKeys(vendorData.phone);
    await driver.findElement(By.id('Entity_Country')).sendKeys(vendorData.country);
    await driver.findElement(By.id('Entity_StateProvince')).sendKeys(vendorData.stateProvince);
    await driver.findElement(By.id('Entity_City')).sendKeys(vendorData.city);
    await driver.findElement(By.id('Entity_Postal')).sendKeys(vendorData.postal);
    await driver.findElement(By.id('Entity_Street')).sendKeys(vendorData.street);
    await driver.findElement(By.id('Entity_Website')).sendKeys(vendorData.website);
    await driver.findElement(By.id('Entity_DoNot_Market')).sendKeys(vendorData.doNotMarket);
    await driver.findElement(By.id('Entity_DoNot_Contact')).sendKeys(vendorData.doNotContact);

    console.log('Filled out Create Vendor form');

    // Step 5: Submit the form
    const submitButton = await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2'));
    await submitButton.click();
    console.log('Submitted Create Vendor form');

    await driver.get('http://localhost:5072/Vendors/MyVendors');
    console.log('Successfully navigated to MyVendor page');

    // Step 6: Assert vendor appears in the list
    const vendorName = vendorData.businessName;
    const vendorElement = await driver.findElement(By.xpath(`//*[contains(text(), "${vendorName}")]`));
    const displayed = await vendorElement.isDisplayed();
    assert.strictEqual(displayed, true, `Vendor "${vendorName}" was not found in the list.`);
    console.log('Vendor successfully created and verified in the list');

  });
  it('shows validation errors when required fields are missing', async () => {
    await driver.get('http://localhost:5072/Vendors/CreateEntities');
  
    // Only fill some fields (omit business name which is required)
    await driver.findElement(By.id('Entity_Phone')).sendKeys('123-456-7890');
  
    const submitButton = await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2'));
    await submitButton.click();
  
    // Assert validation message is displayed
    const validationMsg = await driver.findElement(By.css('.field-validation-error')).getText();
    assert.ok(validationMsg.length > 0, 'Expected a validation error, but none was shown');
    console.log('Validation error displayed as expected');
  });
  it('shows validation error when an invalid website URL is submitted', async () => {  
    await driver.get('http://localhost:5072/Vendors/CreateEntities');
  
    const vendorData = {
      businessName: 'Broken Link Realty',
      category: '1',
      phone: '987-654-3210',
      country: 'USA',
      stateProvince: 'NY',
      city: 'Error City',
      postal: '54321',
      street: '456 Broken Ave',
      website: 'not-a-url', // Invalid URL
      doNotMarket: 'false',
      doNotContact: 'false'
    };
  
    await driver.findElement(By.id('Entity_EntityName')).sendKeys(vendorData.businessName);
    await driver.findElement(By.id('Entity_Category')).sendKeys(vendorData.category);
    await driver.findElement(By.id('Entity_Phone')).sendKeys(vendorData.phone);
    await driver.findElement(By.id('Entity_Country')).sendKeys(vendorData.country);
    await driver.findElement(By.id('Entity_StateProvince')).sendKeys(vendorData.stateProvince);
    await driver.findElement(By.id('Entity_City')).sendKeys(vendorData.city);
    await driver.findElement(By.id('Entity_Postal')).sendKeys(vendorData.postal);
    await driver.findElement(By.id('Entity_Street')).sendKeys(vendorData.street);
    await driver.findElement(By.id('Entity_Website')).sendKeys(vendorData.website);
    await driver.findElement(By.id('Entity_DoNot_Market')).sendKeys(vendorData.doNotMarket);
    await driver.findElement(By.id('Entity_DoNot_Contact')).sendKeys(vendorData.doNotContact);
  
    const submitButton = await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2'));
    await submitButton.click();
  
    // Assert website field triggers validation
    const websiteValidationMsg = await driver.findElement(By.css('#Entity_Website ~ span.field-validation-error')).getText();
    assert.ok(websiteValidationMsg.length > 0, 'Expected a website validation error, but none was shown');
    console.log('Invalid website validation message displayed as expected');
  });  
});


