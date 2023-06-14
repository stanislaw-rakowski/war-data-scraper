import "dotenv/config";
import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { HtmlScraperData, HtmlScraperDataKeys } from "./types";

const url = String(process.env.WEBSITE_URL_2);

async function getWebsiteContent(url: string) {
	const dom = await getWebsiteDOM(url);

	const listItemElements = dom.window.document.querySelectorAll("li.gold");

	const dataList: Partial<HtmlScraperData>[] = [];

	Array.from(listItemElements)
		.slice(1)
		.forEach(li => {
			const dateElement = li.querySelector(".black");
			const casualtiesElement = li.querySelector(".casualties");

			const date = dateElement?.textContent?.trim() || "";
			const categoryElements = casualtiesElement?.querySelectorAll("li");

			const data: Partial<HtmlScraperData> = {};

			categoryElements?.forEach(categoryElement => {
				const categoryText = categoryElement.textContent || "";
				const matches = categoryText.match(/([^—]+)—\s*(\d+).*?(\(\+\d+\))?/);

				if (matches && matches.length >= 3) {
					const [_, category] = matches;
					const categoryName = category.trim() as HtmlScraperDataKeys;
					const changeValue = extractNumber(matches.input as string);

					data[categoryName] = changeValue;
				}
			});

			dataList.push({ date, ...data });
		});

	return dataList;
}

function addMissingKeys(
	objects: Partial<HtmlScraperData>[]
): HtmlScraperData[] {
	const keys = Array.from(
		new Set(objects.flatMap(obj => Object.keys(obj)))
	) as HtmlScraperDataKeys[];

	const result = objects.map(obj => {
		const newObj = { ...obj };
		keys.forEach(key => {
			if (!(key in newObj)) {
				newObj[key] = 0;
			}
		});
		return newObj;
	}) as HtmlScraperData[];

	return result;
}

function extractNumber(input: string): number {
	const regex = /\(\+(\d+)\)/;
	const match = input.match(regex);

	if (match && match.length > 1) {
		return parseInt(match[1]);
	} else {
		return 0;
	}
}

async function getWebsiteDOM(url: string): Promise<JSDOM> {
	const response = await fetch(url);

	const html = await response.text();

	return new JSDOM(html);
}

export default async function htmlScraper() {
	const baseUrl = `${url}russian-invading/casualties`;
	const dom = await getWebsiteDOM(baseUrl);

	const linkElements = dom.window.document.querySelectorAll(".ajaxmonth a");
	const hrefValues = [
		baseUrl,
		...Array.from(linkElements).map(
			link => `${url}${link.getAttribute("href")}`
		),
	];

	const values = await Promise.all(
		hrefValues.map(href => getWebsiteContent(href as string))
	);

	const data: Partial<HtmlScraperData>[] = values
		.flatMap(array => array)
		.filter(obj => obj.date !== "See also:");

	fs.writeFileSync(
		"data_2.json",
		JSON.stringify(addMissingKeys(data), undefined, 2)
	);
}
