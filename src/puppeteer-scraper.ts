import "dotenv/config";
import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath, type ElementHandle, type Page } from "puppeteer";
import {
	puppeteerScraperDataKeys,
	type PuppeteerScraperDataKeys,
	type PuppeteerScraperData,
} from "./types";

const url = String(process.env.WEBSITE_URL_1);

async function getElementTextContent(
	element: ElementHandle<Element>
): Promise<string | null> {
	return element.evaluate(el => el.textContent);
}

function cleanScrapedValue(value: string | null | undefined): number {
	if (typeof value === "string") {
		return Math.abs(
			parseInt(value.replace(/[^0-9.-]+/g, "").replace(".", ""), 10)
		);
	}

	return 0;
}

async function getPageData(page: Page) {
	const targetElements = await page.$$(".card__amount-progress");

	const elementValues = await Promise.all(
		targetElements.map(getElementTextContent)
	);

	const data = Object.fromEntries(
		puppeteerScraperDataKeys.map((key, index) => [
			key,
			cleanScrapedValue(elementValues[index]),
		])
	) as Record<PuppeteerScraperDataKeys, number>;

	const dateElement = await page.$(".date__label");
	const date =
		(dateElement && (await getElementTextContent(dateElement))) || "";

	return { date, ...data };
}

export default function puppeteerScraper() {
	puppeteer.use(StealthPlugin());

	puppeteer
		.launch({ headless: false, executablePath: executablePath() })
		.then(async browser => {
			const page = await browser.newPage();

			await page.goto(url);

			await page.waitForSelector(".card__amount-total");

			const results: PuppeteerScraperData[] = [];

			for (let i = 0; i <= 23; i++) {
				const data = await getPageData(page);

				results.push(data);

				await page.waitForTimeout(100);

				const arrowElement = await page.$(".date > .control-btn:first-child");

				await arrowElement?.click();
			}

			fs.writeFileSync("data_1.json", JSON.stringify(results, undefined, 2));

			await browser.close();
		});
}
