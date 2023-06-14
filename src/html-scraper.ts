import "dotenv/config";
import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import type { HtmlScraperData, HtmlScraperDataKeys } from "./types";

const url = String(process.env.WEBSITE_URL_2);

function parseDataElementsValues(
	elements: HTMLLIElement[]
): Partial<HtmlScraperData> {
	return elements.reduce((data, element) => {
		const categoryText = element.textContent || "";
		const matches = categoryText.match(/([^—]+)—\s*(\d+).*?(\(\+\d+\))?/);

		if (matches && matches.length >= 3) {
			const [_, category] = matches;
			const categoryName = category.trim() as HtmlScraperDataKeys;
			const changeValue = extractNumber(matches.input as string);

			data[categoryName] = changeValue;
		}

		return data;
	}, {} as Partial<HtmlScraperData>);
}

async function getWebsiteContent(
	url: string
): Promise<Partial<HtmlScraperData>[]> {
	const dom = await getWebsiteDOM(url);

	const listItemElements = dom.window.document.querySelectorAll("li.gold");

	return Array.from(listItemElements)
		.slice(1)
		.map(li => {
			const dateElement = li.querySelector(".black");
			const casualtiesElement = li.querySelector(".casualties");

			const date = dateElement?.textContent?.trim() || "";
			const categoryElements = Array.from(
				casualtiesElement?.querySelectorAll("li") ?? []
			);

			const data = parseDataElementsValues(categoryElements);

			return { date, ...data };
		}) as Partial<HtmlScraperData>[];
}

function addMissingKeys(
	objects: Partial<HtmlScraperData>[]
): HtmlScraperData[] {
	const keys = Array.from(
		new Set(objects.flatMap(obj => Object.keys(obj)))
	) as HtmlScraperDataKeys[];

	return objects.map(obj => {
		const newObj = { ...obj };
		keys.forEach(key => {
			if (!(key in newObj)) {
				newObj[key] = 0;
			}
		});
		return newObj;
	}) as HtmlScraperData[];
}

function extractNumber(input: string): number {
	const regex = /\(\+(\d+)\)/;
	const match = input.match(regex);

	if (match && match.length > 1) {
		return parseInt(match[1]);
	}

	return 0;
}

async function getWebsiteDOM(url: string): Promise<JSDOM> {
	const response = await fetch(url);

	const html = await response.text();

	return new JSDOM(html);
}

function parseScrapedValues(
	values: Partial<HtmlScraperData>[][]
): HtmlScraperData[] {
	const filteredValues = values
		.flatMap(array => array)
		.filter(obj => obj.date !== "See also:");

	return addMissingKeys(filteredValues);
}

export default async function htmlScraper() {
	const baseUrl = `${url}russian-invading/casualties`;
	const dom = await getWebsiteDOM(baseUrl);

	const linkElements = dom.window.document.querySelectorAll(".ajaxmonth a");
	const linksHrefValues = [
		baseUrl,
		...Array.from(linkElements).map(
			link => `${url}${link.getAttribute("href")}`
		),
	];

	const scrapedValues = await Promise.all(
		linksHrefValues.map(href => getWebsiteContent(href as string))
	);

	const data = parseScrapedValues(scrapedValues);

	fs.writeFileSync("data_2.json", JSON.stringify(data, undefined, 2));
}
