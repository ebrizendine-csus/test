const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

describe('Add a transaction Test', function () {
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

    it('add a new transaction', async () => {
        // Step 1: Login
        await driver.get('http://localhost:5072/Identity/Account/Login/Login');
        console.log('Navigated to login page');

        await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
        await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
        await driver.findElement(By.css('button[type="submit"]')).click();
        console.log('Logged in');

        await driver.get('http://localhost:5072/Dashboard');
        console.log('Navigated to dashboard');

        // Step 2: Navigate to Transactions Page
        await driver.get('http://localhost:5072/Transactions/Transactions');
        console.log('Navigated to Transactions page');

        // Step 3: Click on Add button to go to Create Person page
        const addButton = await driver.findElement(By.css('a[href="/Transactions/ViewTransaction"]'));
        await addButton.click();
        console.log('Clicked on Add button to go to Create Transaction page');

        await driver.get('http://localhost:5072/Transactions/ViewTransaction');
        console.log('Navigated to Create Transaction page');

        await driver.sleep(1000); // Temporary fix

        // Step 4: Fill out Create Person form
        const transactionData = {
            depositDate: '03-05-2025',
            inspectionDate: '03-07-2025',
            loanDate: '03-14-2025',
            appraisalDate: '03-15-2025',
            propertyInformation: 'Family home',
            transitionDetails: 'documents included',
            status: 'Pending',
            comments: 'completed test'
        };

        await driver.findElement(By.id('Transaction_DepositDate')).sendKeys(transactionData.depositDate);
        await driver.findElement(By.id('Transaction_InspectionDate')).sendKeys(transactionData.inspectionDate);
        await driver.findElement(By.id('Transaction_LoanDate')).sendKeys(transactionData.loanDate);
        await driver.findElement(By.id('Transaction_AppraisalDate')).sendKeys(transactionData.appraisalDate);
        await driver.findElement(By.id('Transaction_PropertyInformation')).sendKeys(transactionData.propertyInformation);
        await driver.findElement(By.id('Transaction_TransitionDetails')).sendKeys(transactionData.transitionDetails);
        // Status Dropdown
        const statusSelect = await driver.findElement(By.id('Transaction_Status'));
        await driver.sleep(1000);
        await statusSelect.click(); // optional, helps if the element needs focus
        await driver.sleep(1000);
        await statusSelect.findElement(By.css('option[value="Pending"]')).click();

        console.log('Completed status select');
        
        await driver.findElement(By.id('Transaction_Comments')).sendKeys(transactionData.comments);

        console.log('Filled out Create Transaction form');

        // Step 5: Submit the form
        const submitButton = await driver.findElement(By.css('button.btn.btn-primary[type="submit"]'));
        await submitButton.click();
        console.log('Submitted Create Transaction form');

        // Step 6: Wait and verify
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "${transactionData.propertyInformation}")]`)), 5000);
        const newRow = await driver.findElement(By.xpath(`//*[contains(text(), "${transactionData.propertyInformation}")]`));
        console.log('New transaction successfully verified');
    });

    it('shows validation errors when required transaction fields are missing', async () => {
        // Go directly to the create transaction page
        await driver.get('http://localhost:5072/Transactions/ViewTransaction');
        console.log('Navigated to Create Transaction page for validation test');
    
        await driver.sleep(1000);

        // Submit form without filling anything
        const submitBtn = await driver.findElement(By.css('button.btn.btn-primary[type="submit"]'));
        await submitBtn.click();
        console.log('Submitted empty transaction form');
    
        // Wait for validation to kick in
        await driver.sleep(1000);
    
        // Confirm we're still on the form page
        const currentUrl = await driver.getCurrentUrl();
        assert(currentUrl.includes('/Transactions/ViewTransaction'), 'User should stay on transaction form page after invalid input');
    
        console.log('Validation errors shown. Still on transaction page as expected.');
    });

});