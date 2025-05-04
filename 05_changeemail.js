const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Change Email Test', function () {
  this.timeout(20000);

  let driver;
  let testUser;
  let newEmail;

  before(async () => {
    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));
    const randomSuffix = Math.floor(Math.random() * 1000000);
    newEmail = `updated${randomSuffix}@example.com`;

    driver = await new Builder().forBrowser('chrome').build();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
      console.log(`Test email used: ${newEmail}`);
    }
  });

  it('Changes the user email', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.wait(until.urlContains('/Dashboard'), 10000);
    await driver.get('http://localhost:5072/Identity/Account/Manage/Email');
    console.log('Navigated to Manage Email page');

    const newEmailField = await driver.findElement(By.id('Input_NewEmail'));
    await driver.wait(until.elementIsVisible(newEmailField), 5000);
    await newEmailField.clear();
    await newEmailField.sendKeys(newEmail);

    const changeButton = await driver.findElement(By.css('form button[type="submit"]'));
    await driver.wait(until.elementIsEnabled(changeButton), 5000);
    await changeButton.click();
    console.log('Submitted change email form');

    // Pass condition: success alert is shown
    const successAlert = await driver.wait(until.elementLocated(By.css('.alert-success')), 5000);
    assert.ok(successAlert, 'Success alert should appear after submitting new email');
    console.log('Success alert displayed, test passed');
  });
});