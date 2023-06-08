import "dotenv/config";
import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath, type ElementHandle } from "puppeteer";

const url = String(process.env.WEBSITE_URL);

const selectors = [".card__amount-total", ".card__amount-progress"] as const;

const keys = [
	"personnel",
	"armored_combat_vehicles",
	"tanks",
	"artillery",
	"aircrafts",
	"helicopters",
	"ships_and_boats",
] as const;

type Selectors = (typeof selectors)[number];

type Keys = (typeof keys)[number];

type ComputedKeys = keyof {
	[K in Selectors as K extends `${string}-${infer R}`
		? `${R}_${Keys}`
		: never]: unknown;
};

async function getElementTextContent(
	element: ElementHandle<Element>
): Promise<string | null> {
	return element.evaluate(el => el.textContent);
}

function cleanScrapedValue(value: string | null | undefined): number {
	if (typeof value === "string") {
		return parseInt(value.replace(/[^0-9.-]+/g, "").replace(".", ""), 10);
	}

	return 0;
}

puppeteer.use(StealthPlugin());

puppeteer
	.launch({ headless: false, executablePath: executablePath() })
	.then(async browser => {
		const page = await browser.newPage();

		await page.goto(url);

		await page.waitForSelector(".card__amount-total");

		async function getElementsValues<T extends string>(
			selector: T
		): Promise<Record<ComputedKeys, string>> {
			const keyPrefix = selector.split("-")[1];

			const targetElements = await page.$$(selector);

			const elementValues = await Promise.all(
				targetElements.map(getElementTextContent)
			);

			return Object.fromEntries(
				keys.map((key, index) => [`${keyPrefix}_${key}`, elementValues[index]])
			) as Record<ComputedKeys, string>;
		}

		const results: Array<Record<ComputedKeys, number> & { date: string }> = [];

		for (let i = 0; i <= 23; i++) {
			const data = await Promise.all(selectors.map(getElementsValues));

			const dateElement = await page.$(".date__label");
			const date =
				(dateElement && (await getElementTextContent(dateElement))) || "";

			const combinedData = data.reduce(
				(acc, val) => ({ ...acc, ...val }),
				{} as Record<ComputedKeys, string>
			);

			const clearedData = Object.fromEntries(
				Object.entries(combinedData).map(([key, value]) => [
					key,
					cleanScrapedValue(value),
				])
			) as Record<ComputedKeys, number>;

			results.push({ ...clearedData, date });

			await page.waitForTimeout(100);

			const arrowElement = await page.$(".date > .control-btn:first-child");

			await arrowElement?.click();
		}

		fs.writeFileSync("data.json", JSON.stringify(results, undefined, 2));

		await browser.close();
	});
