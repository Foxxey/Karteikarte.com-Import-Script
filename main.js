const {
    Builder,
    By
} = require('selenium-webdriver');
const fs = require('fs');
const csv = require('csv-parser');

// Array to store the indices of required command line arguments
const requiredArgs = [];
const i = (a) => {a = args.indexOf(a); requiredArgs.push(a); return a;};
// Parse command line arguments
const args = process.argv.slice(2);
const username = args[i('-u') + 1];
const password = args[i('-p') + 1];
const inputFile = args[i('-i') + 1];
const lessonId = args[i('-id') + 1];
const multipleEntries = args.indexOf('-m') != -1;

// Validate required arguments
if (Math.min(...requiredArgs) == -1) {
    console.log('Missing required arguments!');
    return;
}

let outputQueue = [];

// Read CSV file and process data
fs.createReadStream(inputFile)
    .pipe(csv({ headers: false }))
    .on('data', (row) => {
        // Extract the first two columns from the CSV row
        row = Object.values(row).slice(0, 2);
        let obj = {'0':[], '1':[]};
            if (multipleEntries) {
                // Split back & fronts content by comma and trim whitespace
                row.forEach((e, i) => {
                    e.split(/\s*,\s*/).forEach(item => {
                        obj[i].push(item.trim());
                    });
                });
                // Generate all possible pairs of entries and add to the outputQueue
                obj[0].forEach(back => obj[1].forEach(front => outputQueue.push([back, front])))
            } else 
            // If multiple entries are not enabled, push the row after trimming content
            outputQueue.push(row.map(e => e.trim()));
    })
    .on('end', () => {
        console.log('\nCSV file processing complete:\n');
        console.log(outputQueue)
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
            await driver.executeScript(`document.querySelector("[mode='primary']")?.click()`);
            await driver.executeScript(`document.getElementById('form_username').value = '${username}';`);
            await driver.executeScript(`document.getElementById('form_password').value = '${password}';`);
            await driver.executeScript(`document.querySelector('.submit').click();`);
        }
        currentUrl = await driver.getCurrentUrl();
        if (currentUrl === 'https://www.karteikarte.com/login') {
            console.log('Login failed.')
            await driver.quit();
        }

        while (outputQueue.length != 0) {
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