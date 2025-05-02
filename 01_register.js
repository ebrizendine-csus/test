const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Registration Form Test', function () {
  this.timeout(20000); // Increase timeout for slow loads

  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    console.log('Browser launched');
  });

  after(async () => {
    if (driver) {
      await driver.quit();
      console.log('Browser closed');
    }
  });

  it('Fills and submits registration form with inputs', async () => {
    await driver.get('http://localhost:5072/Identity/Account/Register/Register');
    console.log('Navigated to registration page');

    const testData = {
      firstName: 'John',
      lastName: 'Smith',
      affiliation: 'TestOrg',
      email: `John${Date.now()}@example.com`,
      phoneNumber: '1234567890',
      role: 'Admin',
      licenseNumber: '1234567',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    await driver.findElement(By.id('firstName')).sendKeys(testData.firstName);
    console.log('First Name:', testData.firstName);

    await driver.findElement(By.id('lastName')).sendKeys(testData.lastName);
    console.log('Last Name:', testData.lastName);

    await driver.findElement(By.id('affiliation')).sendKeys(testData.affiliation);
    console.log('Affiliation:', testData.affiliation);

    await driver.findElement(By.id('email')).sendKeys(testData.email);
    console.log('Email:', testData.email);

    await driver.findElement(By.id('phoneNumber')).sendKeys(testData.phoneNumber);
    console.log('Phone Number:', testData.phoneNumber);

    const roleSelect = await driver.findElement(By.id('role'));
    await roleSelect.click();
    await roleSelect.findElement(By.css(`option[value="${testData.role}"]`)).click();
    console.log('Role selected:', testData.role);

    await driver.findElement(By.id('licenseNumber')).sendKeys(testData.licenseNumber);
    console.log('License Number:', testData.licenseNumber);

    await driver.findElement(By.id('password')).sendKeys(testData.password);
    console.log('Password entered:', testData.password);

    await driver.findElement(By.id('confirmPassword')).sendKeys(testData.confirmPassword);
    console.log('Confirm Password entered:', testData.confirmPassword);

    await driver.findElement(By.id('cbpolicy')).click();
    console.log('Terms checkbox clicked');

    await driver.findElement(By.id('Submit')).click();
    console.log('Form submitted');

    await driver.wait(until.urlContains('/Home'), 10000);
    const currentUrl = await driver.getCurrentUrl();

    fs.writeFileSync('./test/lastCreatedUser.json', JSON.stringify({
      email: testData.email,
      password: testData.password
    }));    

    console.log('Redirected URL:', currentUrl);
    assert.ok(currentUrl.includes('/Home'), 'Registration may have failed');
  });
});
