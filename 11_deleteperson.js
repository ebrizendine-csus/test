const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Delete Person Test', function () {
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

  it('Deleted the first person in the table', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.wait(until.urlContains('/Dashboard'), 10000);
    console.log('Dashboard loaded');

    // Step 2: Go to People page
    await driver.get('http://localhost:5072/People/People');
    console.log('Navigated to People page');

    // Step 3: Capture the name of the first person (for verification after deletion)
    const firstPersonEmailCell = await driver.findElement(By.xpath('//table/tbody/tr[1]/td[5]'));
    const deletedPersonEmail = await firstPersonEmailCell.getText();


    // Step 4: Click the first Delete button in the table
    const firstDeleteButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Delete")]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstDeleteButton);
    await driver.sleep(500); // optional: wait for scroll to settle
    await firstDeleteButton.click();
    console.log('Clicked first Delete button in the table');

    const modal = await driver.findElement(By.id('deletePersonModal'));
    await driver.wait(until.elementIsVisible(modal), 10000);
    console.log('Delete Person modal is visible');

    const deleteButton = await driver.findElement(By.xpath('//button[text()="Delete"]'));
    await deleteButton.click();
    console.log('Clicked Delete in modal');

    // Step 5: Wait for the page to reload or update and assert that the deleted person is gone
    await driver.sleep(1000); // give time for table to refresh

    const rows = await driver.findElements(By.xpath(`//table/tbody/tr/td[contains(text(), "${deletedPersonEmail}")]`));
    assert.strictEqual(rows.length, 0, `Expected "${deletedPersonEmail}" to be deleted, but it still appears in the table.`);
    console.log('Person was successfully deleted');

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

    // Step 5: Submit the form
    const submitButton = await driver.findElement(By.css('button[type="submit"].btn.btn-primary.me-2'));
    await submitButton.click();
    console.log('Added person back');
  });
});
