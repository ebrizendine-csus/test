const { Builder, By, until, Alert } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Create Listing Test', function () {
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

  it('creates a new listing', async () => {
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
    const addButtonPerson = await driver.findElement(By.css('a[href="/People/CreatePerson"]'));
    await addButtonPerson.click();
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
    const submitButtonPerson = await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2'));
    await submitButtonPerson.click();
    console.log('Submitted Create Person form');
    await driver.get('http://localhost:5072/People/People');
    console.log('Successfully created person and navigated to MyPeople page');


    // Step 6: Navigate to the MyListings page
    await driver.get('http://localhost:5072/Listings/MyListings');
    console.log('Navigated to MyListings page');

    // Step 7: Open the "Add Listing" modal
    const addButton = await driver.wait(
      until.elementLocated(By.css('button[data-bs-target="#AddListingModal"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(addButton), 5000);
    await addButton.click();
    console.log('Opened Add Listing modal');

    // Wait for modal to render
    const modal = await driver.wait(until.elementLocated(By.id('AddListingModal')), 5000);
    await driver.wait(until.elementIsVisible(modal), 5000);

    // Step 8: Fill out Create Person form
    const listingData = {
      property: 'Springfield',
      price: '1234567890',
      status: 'ACTIVE',
      source: 'Internal'
    };

    await driver.findElement(By.id('property')).sendKeys(listingData.property);
    await driver.findElement(By.id('listingPrice')).sendKeys(listingData.price);
    await driver.findElement(By.id('listingStatus')).sendKeys(listingData.status);
    await driver.findElement(By.id('listingSource')).sendKeys(listingData.source);

    console.log('Filled out Create Listing form');

    // Step 9: Submit the form
    const submitButton = await driver.findElement(By.css('#AddListingModal button[type="submit"]'));
    await submitButton.click();
    console.log('Submitted Create Listing form');

    // Wait for the alert to appear
    await driver.wait(until.alertIsPresent(), 5000); // 5 seconds

    // Switch to the alert and accept it
    const alert = await driver.switchTo().alert();
    await alert.accept(); // Clicks "OK" on the alert
    console.log("Alert accepted");

    // Wait for redirect or table reload
    await driver.sleep(2000);
    await driver.get('http://localhost:5072/Listings/MyListings');
    console.log('Reloaded MyListings page to confirm addition');

    // Step 10: Verify the new property appears in the table
    const tableRows = await driver.findElements(By.css('table tbody tr'));
    const expectedListingData = {
      property: 'Springfield',
      price: '1234567890',
      status: 'ACTIVE'
    };
    let listingFound = false;

    for (const row of tableRows) {
      const cells = await row.findElements(By.css('td'));
      const rowText = await Promise.all(cells.map(cell => cell.getText()));
      if (rowText.includes(expectedListingData.property)) {
        listingFound = true;
        break;
      }
    }
    
    assert(listingFound, 'Newly added listing should appear in the listings table');
    console.log('Verified listing appears in the table');
  });
  it('shows validation errors when required fields are missing', async () => {
    await driver.get('http://localhost:5072/Listings/MyListings');
  
    // Open the "Add Listing" modal
    const addButton = await driver.wait(
      until.elementLocated(By.css('button[data-bs-target="#AddListingModal"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(addButton), 5000);
    await addButton.click();
    console.log('Opened Add Listing modal');

    // Wait for modal to render
    const modal = await driver.wait(until.elementLocated(By.id('AddListingModal')), 5000);
    await driver.wait(until.elementIsVisible(modal), 5000);

    // Only fill some fields (omit business name which is required)
    await driver.findElement(By.id('listingPrice')).sendKeys('1234567890');
  
    // Submit the form
    const submitButton = await driver.findElement(By.css('#AddListingModal button[type="submit"]'));
    await submitButton.click();
    console.log('Submitted Create Listing form');
  
    // Try to wait for success alert (but expect it to NOT appear)
    let alertAppeared = false;
    try {
      await driver.wait(until.alertIsPresent(), 3000);  // Wait for 3s max
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      console.log("Unexpected alert text:", alertText);
      alertAppeared = true;
      await alert.dismiss(); // or alert.accept()
    } catch (err) {
      // No alert — expected if submission failed
      console.log('No alert appeared — form submission was blocked as expected.');
    }

    assert.strictEqual(alertAppeared, false, "Form should not have been submitted — alert appeared unexpectedly");
  });
});