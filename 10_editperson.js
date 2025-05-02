const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Edit Person Test', function () {
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

  it('edits the first person in the table and verifies the change', async () => {
    const updatedFirstName = 'UpdatedFirstName';

    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/Dashboard'), 10000);
    console.log('Logged in and on dashboard');

    // Step 2: Go to People page
    await driver.get('http://localhost:5072/People/People');
    console.log('Navigated to People page');

    // Step 3: Click the first Edit button
    const firstEditButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Edit")]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstEditButton);
    await driver.sleep(500);
    await firstEditButton.click();
    console.log('Opened edit modal');

    // Step 4: Wait for modal and edit first name
    const modal = await driver.findElement(By.id('updateModal'));
    await driver.wait(until.elementIsVisible(modal), 10000);
    const firstNameInput = await driver.findElement(By.css('input[name="PersonRecord.NameFirst"]'));
    await firstNameInput.clear();
    await driver.sleep(500);
    await firstNameInput.sendKeys(updatedFirstName);
    console.log('First name updated');

    // Step 5: Navigate to last modal step
    const nextButton = await driver.findElement(By.id('personNextBtn'));
    await nextButton.click();
    await driver.sleep(500);
    await nextButton.click();
    await driver.sleep(500);

    // Step 6: Save changes
    const saveButton = await driver.findElement(By.id('personSubmitBtn'));
    await driver.wait(until.elementIsVisible(saveButton), 5000);
    await saveButton.click();
    console.log('Saved person changes');

    // Step 7: Wait for modal to close and refresh the table
    await driver.wait(until.stalenessOf(modal), 10000);
    await driver.sleep(1000); // small wait for table to update

    // Step 8: Verify updated name in the first row
    const updatedNameCell = await driver.findElement(By.xpath('//table/tbody/tr[1]/td[3]')); // adjust column if needed
    const cellText = await updatedNameCell.getText();
    assert.strictEqual(cellText.includes(updatedFirstName), true, `Expected first name to be '${updatedFirstName}', but got '${cellText}'`);

    console.log('Verified edited name in the table');
  });
  it('fails to save when required field (first name) is left blank', async () => {
    // Step 1: Go to People page (assumes already logged in)
    await driver.get('http://localhost:5072/People/People');
    console.log('Navigated to People page for invalid input test');

    // Step 2: Click the first Edit button
    const firstEditButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Edit")]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstEditButton);
    await driver.sleep(500);
    await firstEditButton.click();
    console.log('Opened edit modal');

    // Step 3: Wait for modal and clear the required first name field
    const modal = await driver.findElement(By.id('updateModal'));
    await driver.wait(until.elementIsVisible(modal), 10000);
    const firstNameInput = await driver.findElement(By.css('input[name="PersonRecord.NameFirst"]'));
    await firstNameInput.clear();
    console.log('Cleared first name input');

    // Step 4: Navigate to final step
    const nextButton = await driver.findElement(By.id('personNextBtn'));
    await nextButton.click();
    await driver.sleep(500);
    await nextButton.click();
    await driver.sleep(500);

    // Step 5: Attempt to save
    const saveButton = await driver.findElement(By.id('personSubmitBtn'));
    await driver.wait(until.elementIsVisible(saveButton), 5000);
    await saveButton.click();
    console.log('Attempted to save with blank required field');

    // Step 6: Confirm error is shown or modal remains open
    const validationError = await driver.findElement(By.css('.field-validation-error')).getText();
    assert(validationError.includes('required') || validationError.length > 0, 'Expected validation error for missing required field');

    console.log('Validation error displayed as expected');
  });
});
