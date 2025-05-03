const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Login Form Test', function () {
  this.timeout(15000);

  let driver;
  let testUser;

  before(async () => {
    // Read last created user details from file
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

  it('log in with the last created user', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    console.log('Email or phone entered:', testUser.email);

    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    console.log('Password entered:', testUser.password);

    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Login form submitted');

    await driver.wait(until.urlContains('/Dashboard'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    console.log('Redirected URL after login:', currentUrl);
    assert.ok(currentUrl.includes('/Dashboard'), 'Login may have failed');
  });
});
