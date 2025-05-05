const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const fs = require('fs');

describe('Complete an Action Test', function () {
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

    it("marks a specific action as completed by title", async () => {
        await driver.get("http://localhost:5072/Actions/MyActions");

        const actionDiv = await driver.wait(until.elementLocated(By.xpath(
            "//div[contains(@class, 'action-title') and contains(text(), 'Follow Up with Mia')]"
        )), 3000);
      
        const form = await actionDiv.findElement(By.xpath("ancestor::form"));
        const checkbox = await form.findElement(By.css("input[type='checkbox']"));
        await checkbox.click();
    });
    
    it("throws an error when trying to complete a non-existent action title", async () => {
        const { Builder, By, until } = require("selenium-webdriver");
        const assert = require("assert");
      
        let driver = await new Builder().forBrowser("chrome").build();
      
        try {
          await driver.get("http://localhost:5072/Actions/MyActions");
      
          const nonExistentTitle = "Nonexistent Action Title";
      
          const checkboxXPath = `//div[contains(@class, 'action-title') and normalize-space(text())="${nonExistentTitle}"]/ancestor::div[contains(@class, 'checkbox-filter')]//input[@type='checkbox']`;
      
          const checkboxes = await driver.findElements(By.xpath(checkboxXPath));
      
          assert.strictEqual(checkboxes.length, 0, "Expected no matching checkboxes, but found some");
      
        } finally {
          await driver.quit();
        }
      });
      
    
});