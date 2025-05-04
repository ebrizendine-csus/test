const { Builder, By } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Create Lead Test', function () {
  this.timeout(20000);

  let driver;
  let testUser;

  before(async () => {
    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));

    const options = new chrome.Options();
    options.addArguments('--force-device-scale-factor=.1');  // 10% zoom

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().window().maximize();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
    }
  });

  it('creates a new Lead', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.get('http://localhost:5072/Dashboard');
    console.log('Navigated to dashboard');

    // Step 2: Navigate to Lead page
    await driver.get('http://localhost:5072/Leads/MyLeads');
    console.log('Navigated to My Leads page');

    // Step 3: Click on Add button to go to Create Person page
    const addButton = await driver.findElement(By.css('.gradient-button'));
    await addButton.click();
    console.log('Clicked on Add button to go to Create Leads page');

    await driver.get('http://localhost:5072/Leads/CreateLead');
    console.log('Navigated to Create Leads page');

    // Step 4: Fill out Create Person form
    const leadsData = {
      firstName: 'Penny',
      middleName: 'Stone',
      lastName: 'Philips',
      email: 'PennyStone@gmail.com',
      phone: '121383993',
      country: 'USA',
      stateProvince: 'CA',
      city: 'Sample City',
      zipcode: '12345',
      street: '123 Main St',
      organizationName: 'KELLE',
      orgranizationTitle: 'Kelle solutions real estate',
      tracking: 'no'
    };

    await driver.findElement(By.id('Lead_NameFirst')).sendKeys(leadsData.firstName);
    await driver.findElement(By.id('Lead_NameMiddle')).sendKeys(leadsData.middleName);
    await driver.findElement(By.id('Lead_NameLast')).sendKeys(leadsData.lastName);
    await driver.findElement(By.id('Lead_Email')).sendKeys(leadsData.email);
    await driver.findElement(By.id('Lead_Phone')).sendKeys(leadsData.phone);
    await driver.findElement(By.id('Lead_Country')).sendKeys(leadsData.country);
    await driver.findElement(By.id('Lead_StateProvince')).sendKeys(leadsData.stateProvince);
    await driver.findElement(By.id('Lead_City')).sendKeys(leadsData.city);
    await driver.findElement(By.id('Lead_Postal')).sendKeys(leadsData.zipcode);
    await driver.findElement(By.id('Lead_Street')).sendKeys(leadsData.street);
    await driver.findElement(By.id('Lead_OrganizationName')).sendKeys(leadsData.organizationName);
    await driver.findElement(By.id('Lead_OrganizationTitle')).sendKeys(leadsData.orgranizationTitle);
    await driver.findElement(By.id('Lead_Tracking')).sendKeys(leadsData.tracking);

    console.log('Filled out Create Leads form');

    // Step 5: Submit the form
    const submitButton = await driver.findElement(By.css('.submit-button'));
    await submitButton.click();
    console.log('Submitted Create Leads form');

    await driver.sleep(500);await driver.sleep(500);await driver.sleep(500);

    await driver.get('http://localhost:5072/Leads/MyLeads');
    console.log('Successfully navigated to My Leads page');

    // Step 6: Assert leads appears in the list
    const leadsName = leadsData.firstName;
    const leadsElement = await driver.findElement(By.xpath(`//*[contains(text(), "${leadsName}")]`));
    const displayed = await leadsElement.isDisplayed();
    assert.strictEqual(displayed, true, `Leads "${leadsName}" was not found in the list.`);
    console.log('Leads successfully created and verified in the list');

  });
  it('shows validation errors when required fields are missing', async () => {
    await driver.get('http://localhost:5072/Leads/CreateLead');
  
    // Only fill some fields
    await driver.findElement(By.id('Lead_Phone')).sendKeys('123-456-7890');
    await driver.findElement(By.id('Lead_Tracking')).sendKeys('No');
    const submitButton = await driver.findElement(By.css('.submit-button'));
    await driver.sleep(900);
    await submitButton.click();
  
    // Assert validation message is displayed
    const validationMsg = await driver.findElement(By.css('.field-validation-error')).getText();
    assert.ok(validationMsg.length > 0, 'Expected a validation error, but none was shown');
    console.log('Validation error displayed as expected');
  });
});


