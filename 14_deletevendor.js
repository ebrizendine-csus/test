const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Delete Vendor Test', function () {
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

  it('Deletes the first vendor in the table', async () => {
    // Step 1: Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.wait(until.urlContains('/Dashboard'), 10000);
    console.log('Dashboard loaded');

    // Step 2: Navigate to Vendors page
    await driver.get('http://localhost:5072/Vendors/MyVendors');
    console.log('Navigated to Vendors page');

    // Step 3: Capture Business Name of the first vendor for verification after deletion
    const firstBusinessNameCell = await driver.findElement(By.xpath('//table/tbody/tr[1]/td[2]'));
    const deletedVendorName = await firstBusinessNameCell.getText();
    console.log(`Preparing to delete vendor: ${deletedVendorName}`);

    // Step 4: Click the first Delete button
    const deleteButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Delete")]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", deleteButton);
    await driver.sleep(500);
    await deleteButton.click();
    console.log('Clicked Delete button');

    // Step 5: Wait for delete modal to appear
    const modal = await driver.findElement(By.id('deleteEntityModal'));
    await driver.wait(until.elementIsVisible(modal), 10000);
    console.log('Delete modal is visible');

    // Step 6: Click "Delete" in modal
    const confirmDeleteButton = await driver.findElement(By.css('#deleteEntityModal .btn.btn-danger'));
    await confirmDeleteButton.click();
    console.log('Confirmed deletion in modal');

    // Step 7: Wait for table to update
    await driver.sleep(1500); // give time for table to refresh

    // Step 8: Verify the deleted vendor is no longer in the table
    const remainingRows = await driver.findElements(By.xpath(`//table/tbody/tr/td[contains(text(), "${deletedVendorName}")]`));
    assert.strictEqual(remainingRows.length, 0, `Expected "${deletedVendorName}" to be deleted, but it still appears in the table.`);
    console.log('Vendor was successfully deleted');
  });
});
