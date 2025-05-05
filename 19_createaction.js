const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Create Action Test', function () {
    this.timeout(20000);

    let driver;
    let testUser;

    before(async () => {
        testUser = JSON.parse(fs.readFileSync('./test/lastCreatedUser.json', 'utf8'));
        
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();
        console.log('Browser launched');
    });

    after(async () => {
        if (driver) {
            await driver.quit();
            console.log('Browser closed');
        }
    })

    it('creates a new action', async () => {
        // Step 1: Login
        await driver.get('http://localhost:5072/Identity/Account/Login/Login');
        console.log('Navigated to login page');

        await driver.findElement(By.id('Input_EmailOrPhone')).sendKeys(testUser.email);
        await driver.findElement(By.id('Input_Password')).sendKeys(testUser.password);
        await driver.findElement(By.css('button[type="submit"]')).click();
        console.log('Logged in');

        await driver.get('http://localhost:5072/Dashboard');
        console.log('Navigated to dashboard');

        // Step 2: Navigate to Action page
        await driver.get('http://localhost:5072/Actions/MyActions');
        console.log('Navigated to Action page');

        // Step 3: Fill out Create Action Form
        const actionData = {
            title: 'Follow Up with Mia',
            operator: '1', // Use "0" for None, "1" for Operator, "2" for Broker, "4" for Public
            team: 'Collins & Carter',
            category: 'Email',
            tag: 'Mia Parker',
            dueDate: '04-30-2025',
            relation: 'Property',
            important: true,
            comments: 'Discuss contract terms'
        };

        await driver.findElement(By.id('ActionEntity_Title')).sendKeys(actionData.title);
        // OPERATOR
        await driver.findElement(By.xpath("//label[contains(text(),'Operator')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Me']")).click();

        // TEAM
        await driver.findElement(By.xpath("//label[contains(text(),'Team')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Jackson & Reed']")).click();

        // CATEGORY
        await driver.findElement(By.xpath("//label[contains(text(),'Category')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='" + actionData.category + "']")).click();

        // TAG
        await driver.findElement(By.xpath("//label[contains(text(),'Tag')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='" + actionData.tag + "']")).click();

        await driver.findElement(By.id('ActionEntity_Due')).sendKeys(actionData.dueDate);
        await driver.sleep(500);
        
        // RELATION
        await driver.findElement(By.xpath("//label[contains(text(),'Relation')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='" + actionData.relation + "']")).click();

        if (actionData.important) {
        await driver.findElement(By.id('importantCheckbox')).click();
        }
        await driver.findElement(By.id('commentInput')).sendKeys(actionData.comments);

        console.log('Filled out Create Action form');

        // Step 4: Submit the form
        const submitButton = await driver.findElement(By.css('button[type="submit"].create-btn'));
        await submitButton.click();
        console.log('Submitted Create Action form');

        // Step 5: Wait and verify
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "${actionData.title}")]`)), 5000);
        const newAction = await driver.findElement(By.xpath(`//*[contains(text(), "${actionData.title}")]`));
        assert(await newAction.isDisplayed(), 'New action not visible in the list');
        console.log('New action successfully verified');
    });
    it('does not create an action if Due Date is missing', async () => {
        await driver.get('http://localhost:5072/Actions/MyActions');
        console.log('Navigated to Action page for missing Due Date test');
    
        const uniqueTitle = 'Missing Due Date ' + Date.now();
    
        // Fill out everything except Due Date
        await driver.findElement(By.id('ActionEntity_Title')).sendKeys(uniqueTitle);
    
        await driver.findElement(By.xpath("//label[contains(text(),'Operator')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Me']")).click();
    
        await driver.findElement(By.xpath("//label[contains(text(),'Team')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Collins & Carter']")).click();
    
        await driver.findElement(By.xpath("//label[contains(text(),'Category')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Email']")).click();
    
        await driver.findElement(By.xpath("//label[contains(text(),'Tag')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Mia Parker']")).click();
    
        await driver.findElement(By.xpath("//label[contains(text(),'Relation')]/following-sibling::button")).click();
        await driver.findElement(By.xpath("//a[@class='dropdown-item status-option' and text()='Property']")).click();
    
        await driver.findElement(By.id('importantCheckbox')).click();
        await driver.findElement(By.id('commentInput')).sendKeys('Missing due date test');
    
        // Submit form without due date
        await driver.findElement(By.css('button[type="submit"].create-btn')).click();
        console.log('Submitted form with missing Due Date');
    
        // Wait a little in case page reloads
        await driver.sleep(1000);
    
        // Try to find the newly added action (which should NOT exist)
        const matchingElements = await driver.findElements(
            By.xpath(`//*[contains(text(), "${uniqueTitle}")]`)
        );
    
        // Assert that the new action is NOT found
        assert.strictEqual(matchingElements.length, 0, 'Action was created despite missing Due Date');
        console.log('No action created, as expected');
    });
    
    
});