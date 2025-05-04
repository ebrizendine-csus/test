const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');  

describe('Create Open House Listing Test', function () {
  this.timeout(30000);

  let driver;
  let testUser;
  let propertyData;

  before(async () => {
    testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));
    const options = new chrome.Options();
    options.addArguments('--force-device-scale-factor=0.5');  // 10% zoom       
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('Browser launched');
    
    propertyData = {
      stateProvince: 'CA',
      city: 'Los Angeles',
      postal: '90001',
      street: '123 Test Lane',
      bed: '3',
      bath: '2',
      year: '2001',
      type: '9'
    };
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('creates a property and sets it as an open house listing', async () => {
    // Login
    await driver.get('http://localhost:5072/Identity/Account/Login/Login');
    await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
    await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    console.log('Logged in');

    // Create Property
    await driver.get('http://localhost:5072/Properties/MyProperties');
    console.log('Navigated to Properties page');

    const addButton = await driver.wait(until.elementLocated(By.css('.gradient-button')), 5000);
    await driver.wait(until.elementIsVisible(addButton), 5000);
    await addButton.click();
    console.log('Opened Add Property modal');

    const modal = await driver.wait(until.elementLocated(By.id('AddPropertyModal')), 5000);
    await driver.wait(until.elementIsVisible(modal), 5000);

    // Fill property form
    await driver.findElement(By.id('propertyStateProvince')).sendKeys(propertyData.stateProvince);
    await driver.findElement(By.id('propertyCity')).sendKeys(propertyData.city);
    await driver.findElement(By.id('propertyPostal')).sendKeys(propertyData.postal);
    await driver.findElement(By.id('propertyStreet')).sendKeys(propertyData.street);
    await driver.findElement(By.id('bedCount')).sendKeys(propertyData.bed);
    await driver.findElement(By.id('bathCount')).sendKeys(propertyData.bath);
    await driver.findElement(By.id('yearConstructed')).sendKeys(propertyData.year);
    
    const { Select } = require('selenium-webdriver/lib/select');
    const propertyTypeSelect = new Select(await driver.findElement(By.id('propertyType')));
    await propertyTypeSelect.selectByValue(propertyData.type);
    console.log('Filled out Add Property form');

    await driver.findElement(By.css('#AddPropertyModal button[type="submit"]')).click();
    console.log('Submitted property form');

    // Wait for property to be saved
    await driver.sleep(2000);

    // Create Listing
    await driver.get('http://localhost:5072/Listings/MyListings');
    console.log('Navigated to Listings page');

    const addListingButton = await driver.wait(until.elementLocated(By.css('.gradient-button')), 5000);
    await driver.wait(until.elementIsVisible(addListingButton), 5000);
    await addListingButton.click();
    console.log('Opened Add Listing modal');

    const listingModal = await driver.wait(until.elementLocated(By.id('AddListingModal')), 5000);
    await driver.wait(until.elementIsVisible(listingModal), 5000);

    // Select the correct property
    const propertySelect = await driver.findElement(By.id('property'));
    const propertyOptions = await propertySelect.findElements(By.css('option'));
    console.log('Looking for property:', propertyData.street);
    
    let targetProperty = null;
    for (const option of propertyOptions) {
      const text = await option.getText();
      console.log('Found property option:', text);
      if (text.includes(propertyData.street)) {
        targetProperty = option;
        console.log('Selected property:', text);
        break;
      }
    }
    
    if (!targetProperty) {
      throw new Error(`Property with address ${propertyData.street} not found in dropdown`);
    }
    await targetProperty.click();

    // Fill listing details
    await driver.findElement(By.id('listingPrice')).sendKeys('500000');
    
    const statusSelect = await driver.findElement(By.id('listingStatus'));
    const statusOptions = await statusSelect.findElements(By.css('option'));
    for (const option of statusOptions) {
      const text = await option.getText();
      if (text.includes('OPEN HOUSE')) {
        await option.click();
        break;
      }
    }

    await driver.findElement(By.id('listingSource')).findElement(By.css('option[value="Internal"]')).click();
    console.log('Filled out Add Listing form');

    await listingModal.findElement(By.css('button[type="submit"]')).click();
    console.log('Submitted listing form');

    // Handle success alert
    try {
      const alert = await driver.wait(until.alertIsPresent(), 5000);
      await alert.accept();
      console.log('Accepted success alert');
    } catch (error) {
      console.log('No alert present, continuing with test');
    }

    // Wait for the modal to close
    await driver.sleep(2000);

    // Verify listing on dashboard
    await driver.get('http://localhost:5072/Dashboard');
    console.log('Navigated to Dashboard');

    // Wait for widgets to load
    await driver.sleep(3000);

    const widgets = await driver.findElements(By.css('.widget'));
    console.log(`Found ${widgets.length} widgets`);

    let openHouseWidget = null;
    for (const widget of widgets) {
      const headerText = await widget.findElement(By.css('h5')).getText();
      console.log('Found widget:', headerText);
      if (headerText === 'Open House Listings') {
        openHouseWidget = widget;
        break;
      }
    }

    if (!openHouseWidget) {
      throw new Error('Open House Listings widget not found on dashboard');
    }

    await driver.wait(until.elementIsVisible(openHouseWidget), 5000);
    console.log('Open House widget is visible');

    const listingItems = await openHouseWidget.findElements(By.css('.listing-item'));
    console.log(`Found ${listingItems.length} listings in widget`);

    let listingFound = false;
    for (const item of listingItems) {
      const listingDetails = await item.findElement(By.css('.listing-details'));
      const titleElement = await listingDetails.findElement(By.css('.listing-title'));
      const titleText = await titleElement.getText();
      console.log('Checking listing:', titleText);
      
      if (titleText.includes(propertyData.street)) {
        listingFound = true;
        console.log('Found matching listing');
        break;
      }
    }

    assert(listingFound, 'Newly created open house listing should appear in the Open House Listings widget');
  });
}); 