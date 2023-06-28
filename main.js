const {
    Builder,
    By
} = require('selenium-webdriver');
const fs = require('fs');
const csv = require('csv-parser');

// Parse command line arguments
const args = process.argv.slice(2);
const username = args[args.indexOf('-u') + 1];
const password = args[args.indexOf('-p') + 1];
const inputFile = args[args.indexOf('-i') + 1];
const lessonId = args[args.indexOf('-id') + 1];
const multipleTranslations = args.indexOf('-m');

// Validate required arguments
if (!username || !password || !lessonId || !inputFile) {
    console.log('Missing required arguments!');
    return;
}

let outputQueue = [];

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        const flippedRow = Object.values(row).reverse();
        var cleanedRow = [];
        if (multipleTranslations) {
            cleanedRow = flippedRow.map((value, index) => {
                if (index === 1 && value.includes(',')) {
                    return value.split(',').map((item) => item.trim());
                }
                return value.trim();
            });

            if (Array.isArray(cleanedRow[1])) {
                cleanedRow[1].forEach((value) => {
                    outputQueue.push([cleanedRow[0], value]);
                });
            } else {
                outputQueue.push(cleanedRow);
            }
        } else {
            cleanedRow = flippedRow.map((value) => value.trim());
            outputQueue.push(cleanedRow);
        }
    })
    .on('end', () => {
        console.log('CSV file processing complete');
    });

(async function () {
    // Set up Selenium WebDriver
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        // Navigate to the desired URL
        const url = `https://www.karteikarte.com/card/edit?lesson_id=${lessonId}`;
        await driver.get(url);

        // Check if the current URL is the login page
        var currentUrl = await driver.getCurrentUrl();
        if (currentUrl === 'https://www.karteikarte.com/login') {
            // Perform login steps using JavaScript
            await driver.executeScript(`document.getElementById('form_username').value = '${username}';`);
            await driver.executeScript(`document.getElementById('form_password').value = '${password}';`);
            await driver.executeScript(`document.querySelector('.submit').click();`);
        }
        currentUrl = await driver.getCurrentUrl();
        if (currentUrl === 'https://www.karteikarte.com/login') {
            console.log('Login failed.')
            await driver.quit();
        }

        while (outputQueue != []) {
            const row = outputQueue.shift();

            // Populate form fields with values from the response array
            await driver.executeScript(`document.getElementById('form_front').value = '${row[0]}';`);
            await driver.switchTo().frame('form_back_ifr');
            await driver.findElement(By.id('tinymce')).sendKeys(row[1]);
            await driver.switchTo().defaultContent();
            await driver.executeScript(`document.getElementById('form_save').click();`);
        }
    } finally {
        // Quit the WebDriver
        await driver.quit();
    }
})();