const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Edit a transaction Test', function () {
    this.timeout(20000);

    let driver;
    let testUser;

    before(async () => {
        testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));
        
        const options = new chrome.Options();
        options.addArguments('--force-device-scale-factor=0.40');  // 40% zoom
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
        await driver.manage().window().maximize();
        console.log('Browser launched');
    });

    after(async () => {
        if (driver) {
            await driver.quit();
            console.log('Browser closed');
        }
    });
    it('edits an existing transaction', async () => {
        await driver.get('http://localhost:5072/Transactions/Transactions');
        console.log('Navigated to Transactions list');
    
        // Step 1: Click on the first "Edit" button (assuming there's at least one transaction)
        const editButton = await driver.findElement(By.css('a.btn.btn-primary.me-2'));
        await editButton.click();
        console.log('Clicked Edit button to open transaction form');
    
        // Step 2: Wait for form to load and update the PropertyInformation
        const propertyInput = await driver.wait(until.elementLocated(By.id('Transaction_PropertyInformation')), 5000);
        await propertyInput.clear();
        await propertyInput.sendKeys('Edited Property Info');
    
        // Optional: Change status too
        const statusSelect = await driver.findElement(By.id('Transaction_Status'));
        await statusSelect.findElement(By.css('option[value="Completed"]')).click();
    
        // Step 3: Submit the updated form
        const submitButton = await driver.findElement(By.css('button[type="submit"]'));
        await submitButton.click();
        console.log('Submitted edited transaction form');
    
        // Step 4: Verify update
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "Edited Property Info")]`)), 5000);
        const updatedRow = await driver.findElement(By.xpath(`//*[contains(text(), "Edited Property Info")]`));
        assert(await updatedRow.isDisplayed(), 'Updated transaction was not found');
        console.log('Transaction successfully updated');
    });
    it('fails to delete a nonexistent transaction', async () => {
        await driver.get('http://localhost:5072/Transactions/Transactions');
        console.log('Navigated to Transactions page');
    
        const fakeId = 999999; // Use an ID you know does not exist
    
        // Try to find the delete button tied to a transaction with the fake ID
        const deleteButtons = await driver.findElements(By.xpath(`//button[contains(@onclick, 'prepareDelete(${fakeId})')]`));
    
        // Expect no such button exists
        assert.strictEqual(deleteButtons.length, 0, 'Unexpectedly found a delete button for a nonexistent transaction');
    
        console.log('No delete button found for nonexistent transaction, as expected');
    });    

});