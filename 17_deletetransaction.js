
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Delete Transaction Test', function () {
  this.timeout(30_000);

  let driver;
  const TABLE = '.content-container table.table';  
  before(async () => {
    const creds = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));
    driver = await new Builder().forBrowser('chrome').build();

    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(creds.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(creds.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/Dashboard'), 10_000);
  });

  after(async () => { await driver?.quit(); });
  it('deletes the first transaction in the table', async () => {


    await driver.get('http://localhost:5072/Transactions/Transactions');


    const firstRow = await driver.wait(async () => {
      const rows = await driver.findElements(By.css(`${TABLE} tbody tr`));
      for (const r of rows) if (await r.isDisplayed()) return r;
      return false;
    }, 10_000, 'No visible transaction rows appeared');


    const transId = await firstRow.findElement(By.css('td:first-child')).getText();


    const deleteBtn = await firstRow.findElement(By.css('button.btn.btn-danger'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', deleteBtn);
    await driver.wait(async () => {
      if (!(await deleteBtn.isDisplayed())) return false;
      const { width, height } = await deleteBtn.getRect();
      return width > 0 && height > 0;
    }, 5_000);
    try { await deleteBtn.click(); }
    catch { await driver.executeScript('arguments[0].click();', deleteBtn); }


    const confirmBtn = await driver.wait(
      until.elementLocated(By.css('#deleteTransactionModal button.btn.btn-danger')),
      5_000
    );
    await driver.wait(async () => {
      if (!(await confirmBtn.isDisplayed())) return false;
      const { width, height } = await confirmBtn.getRect();
      return width > 0 && height > 0;
    }, 5_000, 'modal Delete button never became interactable');
    try { await confirmBtn.click(); }
    catch { await driver.executeScript('arguments[0].click();', confirmBtn); }


    try {
      await driver.wait(until.alertIsPresent(), 5_000);
      await driver.switchTo().alert().accept();
    } catch (_) { }

    await driver.wait(until.stalenessOf(firstRow), 10_000);

    const leftovers = await driver.findElements(
      By.xpath(`//tbody/tr/td[1][text()="${transId}"]`)
    );
    assert.strictEqual(
      leftovers.length,
      0,
      `Transaction ID ${transId} is still present after deletion`
    );
  });
});
