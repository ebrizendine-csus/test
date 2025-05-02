const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

describe('Download Personal Data Test', function () {
  this.timeout(30000);

  let driver;
  const downloadDir = path.resolve(__dirname, 'downloads');
  let testUser;

  before(async () => {
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));

    const options = new chrome.Options();
    options.setUserPreferences({
      'download.default_directory': downloadDir,
      'download.prompt_for_download': false,
      'profile.default_content_settings.popups': 0,
    });

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('downloads the personal data file', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains('/Dashboard'), 10000);

    await driver.get('http://localhost:5072/Identity/Account/Manage/PersonalData');
    await driver.wait(until.elementLocated(By.id('download-data')), 10000);

    // Clean download directory before test
    fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));

    // Submit download form
    await driver.findElement(By.css('#download-data button[type="submit"]')).click();

    // Wait until file appears in directory (adjust filename as needed if it's predictable)
    let fileDownloaded = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(res => setTimeout(res, 500));
      const files = fs.readdirSync(downloadDir);
      if (files.length > 0) {
        fileDownloaded = true;
        break;
      }
    }

    assert.ok(fileDownloaded, 'Personal data file was not downloaded');
    console.log('Download completed successfully');
  });
});
