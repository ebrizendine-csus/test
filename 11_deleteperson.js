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
  });
});
