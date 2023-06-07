import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";

puppeteer.use(StealthPlugin());

puppeteer
	.launch({ headless: false, executablePath: executablePath() })
	.then(async browser => {
		const page = await browser.newPage();

		await page.goto("https://www.minusrus.com/en");

		const textSelector = await page.waitForSelector(".card__amount-total");
		const fullTitle = await textSelector?.evaluate(el => el.textContent);
		// Print the full title
		console.log("Personnel ", fullTitle);

		await page.waitForTimeout(100);

		const arrowSelector = await page.$(".date > .control-btn:first-child");

		console.log(arrowSelector);
		await arrowSelector?.click();

		const textSelector2 = await page.waitForSelector(".card__amount-total");
		const fullTitle2 = await textSelector2?.evaluate(el => el.textContent);
		// Print the full title
		console.log("Personnel ", fullTitle2);
		await browser.close();
	});
