import "dotenv/config";
import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const url = String(process.env.WEBSITE_URL_2);

async function getWebsiteContent(url: string) {
	const dom = await getWebsiteDOM(url);

	const listItemElements = dom.window.document.querySelectorAll("li.gold");

	const dataList: Record<string, any>[] = [];

	Array.from(listItemElements)
		.slice(1)
		.forEach((li, index) => {
			const dateElement = li.querySelector(".black");
			const casualtiesElement = li.querySelector(".casualties");

			const date = dateElement?.textContent?.trim() || "";
			const categoryElements = casualtiesElement?.querySelectorAll("li");

			const data: Record<string, any> = {
				date,
			};

			categoryElements?.forEach(categoryElement => {
				const categoryText = categoryElement.textContent || "";
				const matches = categoryText.match(/([^—]+)—\s*(\d+).*?(\(\+\d+\))?/);

				if (matches && matches.length >= 3) {
					const [_, category, count] = matches;
					const categoryName = category.trim();
					const countValue = parseInt(count.replace(/,/g, ""), 10);
					const changeValue = extractNumber(matches.input as string);

					data[categoryName] = changeValue;
				}
			});

			dataList.push(data);
		});

	return dataList;
}

function addMissingKeys(
	objects: { [key: string]: number }[]
): { [key: string]: number }[] {
	// Find all unique keys across all objects
	const keys = Array.from(new Set(objects.flatMap(obj => Object.keys(obj))));

	// Add missing keys to each object with a value of zero
	const result = objects.map(obj => {
		const newObj = { ...obj };
		keys.forEach(key => {
			if (!(key in newObj)) {
				newObj[key] = 0;
			}
		});
		return newObj;
	});

	return result;
}

function extractNumber(input: string): number {
	const regex = /\(\+(\d+)\)/; // Regex to match "(+9)" pattern
	const match = input.match(regex); // Find the match in the input string

	if (match && match.length > 1) {
		return parseInt(match[1]); // Extract the number from the match
	} else {
		return 0; // Return zero if no match found
	}
}

async function getWebsiteDOM(url: string) {
	const response = await fetch(url);

	const html = await response.text();

	return new JSDOM(html);
}

export default async function main() {
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

	const data: any = values
		.flatMap(array => array)
		.filter(obj => obj.date !== "See also:");

	fs.writeFileSync(
		"data_2.json",
		JSON.stringify(addMissingKeys(data), undefined, 2)
	);
}
