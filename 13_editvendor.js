const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Edit Vendor Test', function () {
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
    await driver.wait(until.elementLocated(By.xpath('//table/tbody/tr[1]')), 10000);
    const firstEditButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Edit") and @data-bs-target="#editEntityModal"]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstEditButton);
    await driver.sleep(500); // optional: wait for scroll to settle
    await firstEditButton.click();
    console.log('Clicked first Edit button in the table');

    // Step 4: Wait for modal to be visible
    const modal = await driver.findElement(By.id('editEntityModal')); // instead of 'updateModal'
    await driver.wait(until.elementIsVisible(modal), 10000);
    console.log('Edit Vendor modal is visible');

    // Step 5: Edit name
    await driver.wait(until.elementLocated(By.id('updateName')), 10000);
    const entityNameInput = await driver.findElement(By.id('updateName'));
    await entityNameInput.clear();
    await driver.sleep(500);
    await entityNameInput.sendKeys('UpdatedBusinessName');
    console.log('Edited business name');

    // Step 7: Click "Save & Exit"
    const saveButton = await driver.findElement(By.css('button[name="saveExit"]'));
    await driver.wait(until.elementIsVisible(saveButton), 5000);
    await saveButton.click();
    console.log('Clicked Save & Exit');

    // Step 9: Wait for the modal to close (not visible)
    await driver.wait(async () => {
      const modalEl = await driver.findElement(By.id('editEntityModal'));
      const isVisible = await modalEl.isDisplayed().catch(() => false);
      return !isVisible;
    }, 10000);    
    console.log('Modal closed');


    // Step 10: Wait for table to update and check for the new business name
    await driver.sleep(1000); // wait a bit for table refresh if it's JS-driven
    const rows = await driver.findElements(By.css('table tbody tr'));
    let nameFound = false;

    for (const row of rows) {
        const cells = await row.findElements(By.css('td'));
        if (cells.length > 1) {
            const text = await cells[1].getText(); // Column 1 is Business Name
            if (text.includes('UpdatedBusinessName')) {
                nameFound = true;
                break;
            }
        }
    }

    assert.strictEqual(nameFound, true, 'Updated business name not found in table');
    console.log('Verified updated business name is in the table');
  });
});
