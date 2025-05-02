const { Builder, By } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Create Person Test', function () {
  this.timeout(20000);

  let driver;
  let testUser;

  before(async () => {
    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));

    driver = await new Builder().forBrowser('chrome').build();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
    }
  });

  it('creates a new person', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.get('http://localhost:5072/Dashboard');
    console.log('Navigated to dashboard');

    // Step 2: Navigate to People page
    await driver.get('http://localhost:5072/People/People');
    console.log('Navigated to People page');

    // Step 3: Click on Add button to go to Create Person page
    const addButton = await driver.findElement(By.css('a[href="/People/CreatePerson"]'));
    await addButton.click();
    console.log('Clicked on Add button to go to Create Person page');

    await driver.get('http://localhost:5072/People/CreatePerson');
    console.log('Navigated to Create Person page');

    // Step 4: Fill out Create Person form
    const personData = {
      firstName: 'John',
      middleName: 'Doe',
      lastName: 'Smith',
      displayName: 'John D. Smith',
      headline: 'Real Estate Agent',
      primaryEmail: testUser.email,
      secondaryEmail: 'john.doe.secondary@example.com',
      primaryEmailLabel: 'Work Email',
      secondaryEmailLabel: 'Personal Email',
      primaryPhone: '123-456-7890',
      secondaryPhone: '098-765-4321',
      primaryPhoneLabel: 'Work Phone',
      secondaryPhoneLabel: 'Home Phone',
      street: '123 Main St',
      city: 'Sample City',
      stateProvince: 'CA',
      postal: '12345',
      country: 'USA',
      comments: 'This is a test user.',
    };

    await driver.findElement(By.id('Person_NameFirst')).sendKeys(personData.firstName);
    await driver.findElement(By.id('Person_NameMiddle')).sendKeys(personData.middleName);
    await driver.findElement(By.id('Person_NameLast')).sendKeys(personData.lastName);
    await driver.findElement(By.id('Person_NameDisplay')).sendKeys(personData.displayName);
    await driver.findElement(By.id('Person_Headline')).sendKeys(personData.headline);
    await driver.findElement(By.id('Person_EmailPrimary')).sendKeys(personData.primaryEmail);
    await driver.findElement(By.id('Person_EmailSecondary')).sendKeys(personData.secondaryEmail);
    await driver.findElement(By.id('Person_EmailPrimaryLabel')).sendKeys(personData.primaryEmailLabel);
    await driver.findElement(By.id('Person_EmailSecondaryLabel')).sendKeys(personData.secondaryEmailLabel);
    await driver.findElement(By.id('Person_PhonePrimary')).sendKeys(personData.primaryPhone);
    await driver.findElement(By.id('Person_PhoneSecondary')).sendKeys(personData.secondaryPhone);
    await driver.findElement(By.id('Person_PhonePrimaryLabel')).sendKeys(personData.primaryPhoneLabel);
    await driver.findElement(By.id('Person_PhoneSecondaryLabel')).sendKeys(personData.secondaryPhoneLabel);
    await driver.findElement(By.id('Person_Street')).sendKeys(personData.street);
    await driver.findElement(By.id('Person_City')).sendKeys(personData.city);
    await driver.findElement(By.id('Person_StateProvince')).sendKeys(personData.stateProvince);
    await driver.findElement(By.id('Person_Postal')).sendKeys(personData.postal);
    await driver.findElement(By.id('Person_Country')).sendKeys(personData.country);
    await driver.findElement(By.id('Person_Comments')).sendKeys(personData.comments);

    console.log('Filled out Create Person form');

    // Step 5: Submit the form
    const submitButton = await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2'));
    await submitButton.click();
    console.log('Submitted Create Person form');

    await driver.get('http://localhost:5072/People/People');
    console.log('Successfully created person and navigated to MyPeople page');
  });

  it('shows validation errors when required fields are missing', async () => {
    // Navigate to Create Person
    await driver.get('http://localhost:5072/People/CreatePerson');
    console.log('Navigated to Create Person page for invalid input test');

    // Leave all fields blank and submit
    await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2')).click();
    console.log('Submitted empty Create Person form');

    // Wait briefly for validation messages
    await driver.sleep(1000);

    // Check for validation errors
    const validationErrors = await driver.findElements(By.css('.validation-summary-errors, .text-danger'));
    assert(validationErrors.length > 0, 'Expected validation error messages for missing required fields');

    // Ensure still on the same page (i.e., not redirected)
    const currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('/People/CreatePerson'), 'Should remain on Create Person page for invalid input');

    console.log('Validation errors correctly displayed and user remains on Create Person page');
  });
});
