export const puppeteerScraperDataKeys = [
	"Military personnel",
	"Armored fighting vehicle",
	"Tanks",
	"Anti-aircraft warfare",
	"Aircrafts",
	"Helicopters",
	"Ships (boats)",
] as const;

export type PuppeteerScraperDataKeys =
	(typeof puppeteerScraperDataKeys)[number];

export type PuppeteerScraperData = Record<PuppeteerScraperDataKeys, number> & {
	date: string;
};

export const htmlScraperDataKeys = [
	"Tanks",
	"Armored fighting vehicle",
	"Cannons",
	"MLRS",
	"Anti-aircraft warfare",
	"Planes",
	"Helicopters",
	"UAV",
	"Cruise missiles",
	"Ships (boats)",
	"Cars and cisterns",
	"Special equipment",
	"Cars",
	"Cisterns with fuel",
	"Mobile SRBM",
	"MLRS Grad",
	"Military personnel",
	"BUK missile system",
] as const;

export type HtmlScraperDataKeys = (typeof htmlScraperDataKeys)[number];

export type HtmlScraperData = Record<HtmlScraperDataKeys, number> & {
	date: string;
};
