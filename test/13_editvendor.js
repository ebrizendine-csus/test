const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Edit Vendor Test', function () {
  this.timeout(30000);

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

  it('edits the first Vendor in the table', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.wait(until.urlContains('/Dashboard'), 10000);
    console.log('Dashboard loaded');

    // Step 2: Go to Vendor page
    await driver.get('http://localhost:5072/Vendors/MyVendors');
    console.log('Navigated to Vendors page');

    // Step 3: Click the first Edit button in the table
    const firstEditButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Edit")]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstEditButton);
    await driver.sleep(500); // optional: wait for scroll to settle
    await firstEditButton.click();
    console.log('Clicked first Edit button in the table');

    // Step 4: Wait for modal to be visible
    const modal = await driver.findElement(By.id('updateModal'));
    await driver.wait(until.elementIsVisible(modal), 10000);
    console.log('Edit Vendor modal is visible');

    // Step 5: Edit first name
    await driver.sleep(500); // allow transition
    const firstNameInput = await driver.findElement(By.css('input[name="PersonRecord.NameFirst"]'));
    await firstNameInput.clear();
    await firstNameInput.sendKeys('UpdatedFirstName');
    console.log('Edited first name');

    // Step 6: Click "Next" twice to go to the last step
    const nextButton = await driver.findElement(By.id('personNextBtn'));
    await nextButton.click();
    await driver.sleep(500); // allow transition
    await nextButton.click();
    await driver.sleep(500);
    console.log('Navigated to last modal step');

    // Step 7: Click "Save & Exit"
    const saveButton = await driver.findElement(By.id('personSubmitBtn'));
    await driver.wait(until.elementIsVisible(saveButton), 5000);
    await saveButton.click();
    console.log('Clicked Save & Exit');
  });
});
