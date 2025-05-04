const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Delete Lead Test', function () {
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

    // Step 2: Go to Leads/AllLeads page

    await driver.get('http://localhost:5072/Leads/Leads');
    console.log('Navigated to Lead page');
    const links = await driver.findElements(By.css('a.btn.btn-link'));
    if (links.length > 0) {
      await driver.wait(until.elementIsVisible(links[1]), 5000);
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", links[1]);
      await driver.sleep(300);
      await links[1].click();
      await driver.wait(until.urlContains('/Leads/AllLeads'), 5000);
      console.log('Clicked View Leads link');
    } else {
      throw new Error('No "View Leads" links found.');
    }

    // Step 3: Capture the name of the first lead (for verification after deletion)
    const firstLeadEmailCell = await driver.findElement(By.xpath('//table/tbody/tr[1]/td[5]'));
    const deletedLeadEmail = await firstLeadEmailCell.getText();


    // Step 4: Click the first Delete button in the table
    const firstDeleteButton = await driver.findElement(By.xpath('//table/tbody/tr[1]//button[contains(text(), "Delete")]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstDeleteButton);
    await driver.sleep(500); // optional: wait for scroll to settle
    await firstDeleteButton.click();
    console.log('Clicked first Delete button in the table');

    const modal = await driver.findElement(By.id('deleteLeadModal'));
    await driver.wait(until.elementIsVisible(modal), 10000);
    console.log('Delete Lead modal is visible');

    const confirmDeleteButton = await driver.findElement(By.css('#deleteLeadModal .btn.btn-danger'));
    await confirmDeleteButton.click();
    console.log('Confirmed deletion in modal');

    // Step 5: Wait for the page to reload or update and assert that the deleted lead is gone
    await driver.sleep(2000); // give time for table to refresh

    const rows = await driver.findElements(By.xpath(`//table/tbody/tr/td[contains(text(), "${deletedLeadEmail}")]`));
    assert.strictEqual(rows.length, 0, `Expected "${deletedLeadEmail}" to be deleted, but it still appears in the table.`);
    console.log('Lead was successfully deleted');
  });
});