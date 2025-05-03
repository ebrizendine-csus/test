const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Profile Management Test', function () {
  this.timeout(20000);

  let driver;
  let testUser;

  // Store updated values for logging after browser is closed
  const updatedValues = {
    FirstName: 'UpdatedFirst',
    LastName: 'UpdatedLast',
    Affiliation: 'UpdatedAffiliation',
    Phone: '5559876543',
    License: '0987654'
  };

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
      console.log(`FirstName: ${updatedValues.FirstName}, LastName: ${updatedValues.LastName}, Affiliation: ${updatedValues.Affiliation}, Email: ${testUser.email}, Phone #: ${updatedValues.Phone}, Role: ${testUser.role || 'Unknown'}, License #: ${updatedValues.License}, Password: ${testUser.password}, Submit Button: clicked`);
    }
  });

  it('updates the profile information including phone and license', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    console.log('Navigated to login page');

    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    await driver.wait(until.urlContains('/Dashboard'), 10000);

    // Go to Manage Profile page
    await driver.get('http://localhost:5072/Identity/Account/Manage');
    await driver.wait(until.elementLocated(By.id('Input_FirstName')), 10000);
    console.log('Navigated to Manage Profile');

    // Fill out the form
    const fields = [
      { id: 'Input_FirstName', value: updatedValues.FirstName },
      { id: 'Input_LastName', value: updatedValues.LastName },
      { id: 'Input_Affiliation', value: updatedValues.Affiliation },
      { id: 'Input_PhoneNumber', value: updatedValues.Phone },
      { id: 'Input_LicenseNumber', value: updatedValues.License }
    ];

    for (const field of fields) {
      const input = await driver.findElement(By.id(field.id));
      await driver.executeScript("arguments[0].value = '';", input);
      await input.sendKeys(field.value);
    }

    // Submit form
    await driver.findElement(By.css('form#profile-form button[type="submit"]')).click();
    console.log('Form submitted');

    // Reload page and verify updated values
    await driver.wait(until.urlContains('/Manage'), 5000);
    await driver.get('http://localhost:5072/Identity/Account/Manage');
    await driver.wait(until.elementLocated(By.id('Input_FirstName')), 10000);

    for (const field of fields) {
      const inputValue = await driver.findElement(By.id(field.id)).getAttribute('value');
      assert.strictEqual(inputValue, field.value, `${field.id} did not match expected value`);
    }

    console.log('All profile fields successfully updated and verified');
  });

  it('should show validation errors for invalid phone number and license number', async () => {  
    // Go to Manage Profile page
    await driver.get('http://localhost:5072/Identity/Account/Manage');
    await driver.wait(until.elementLocated(By.id('Input_FirstName')), 10000);
    console.log('Navigated to Manage Profile');
  
    const invalidPhone = 'abc123';
    const invalidLicense = '1234';
  
    const invalidFields = [
      { id: 'Input_PhoneNumber', value: invalidPhone },
      { id: 'Input_LicenseNumber', value: invalidLicense }
    ];
  
    for (const field of invalidFields) {
      const input = await driver.findElement(By.id(field.id));
      await driver.executeScript("arguments[0].value = '';", input);
      await input.sendKeys(field.value);
    }
  
    await driver.findElement(By.css('form#profile-form button[type="submit"]')).click();
    console.log('Submitted form with invalid inputs');
  
    // Wait for potential validation messages
    await driver.sleep(1000); // brief wait for DOM update
  
    for (const field of invalidFields) {
      const input = await driver.findElement(By.id(field.id));
      const classAttribute = await input.getAttribute('class');
      assert(classAttribute.includes('input-validation-error'), `${field.id} should have validation error class`);
    }
  
    console.log('Validation errors successfully detected for invalid inputs');
  });
});
