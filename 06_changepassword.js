const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Change Password Test', function () {
  this.timeout(20000);

  let driver;
  let testUser;
  let newPassword;

  before(async () => {
    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));

    const randomSuffix = Math.floor(Math.random() * 1000000); // Random 6-digit number
    newPassword = `Password${randomSuffix}!`;

    driver = await new Builder().forBrowser('chrome').build();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
      console.log(`Password changed to: ${newPassword}`);
    }
  });

  it('changes the user password', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.wait(until.urlContains('/Dashboard'), 10000);

    await driver.get('http://localhost:5072/Identity/Account/Manage/ChangePassword');
    await driver.wait(until.elementLocated(By.id('Input_OldPassword')), 10000);
    console.log('Navigated to Change Password page');

    await driver.findElement(By.id('Input_OldPassword')).sendKeys(testUser.password);
    await driver.findElement(By.id('Input_NewPassword')).sendKeys(newPassword);
    await driver.findElement(By.id('Input_ConfirmPassword')).sendKeys(newPassword);
    await driver.findElement(By.css('form#change-password-form button[type="submit"]')).click();
    console.log('Password form submitted');

    await driver.wait(until.elementLocated(By.css('.alert-success')), 5000);
    console.log('Password changed successfully');

    // Update JSON with new password
    testUser.password = newPassword;
    fs.writeFileSync('./test/lastCreatedUser.json', JSON.stringify(testUser, null, 2));
  });

  it('shows validation error for incorrect old password and invalid new password', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Manage/ChangePassword');
    await driver.wait(until.elementLocated(By.id('Input_OldPassword')), 10000);
    console.log('Navigated to Change Password page');

    const wrongOldPassword = 'WrongPassword123!';
    const invalidNewPassword = 'short'; 

    await driver.findElement(By.id('Input_OldPassword')).sendKeys(wrongOldPassword);
    await driver.findElement(By.id('Input_NewPassword')).sendKeys(invalidNewPassword);
    await driver.findElement(By.id('Input_ConfirmPassword')).sendKeys(invalidNewPassword);
    await driver.findElement(By.css('form#change-password-form button[type="submit"]')).click();
    console.log('Submitted form with invalid old password and invalid new password');

    // Wait for error message(s) to appear
    await driver.sleep(1000); // wait briefly for error messages

    // Check that success message does NOT appear
    const alerts = await driver.findElements(By.css('.alert-success'));
    assert.strictEqual(alerts.length, 0, 'Success alert should not appear for invalid input');

    const validationSummary = await driver.findElements(By.css('.validation-summary-errors, .text-danger'));
    assert(validationSummary.length > 0, 'Expected validation or error messages to appear');

    console.log('Validation errors correctly shown for incorrect old password and invalid new password');
  });
});
