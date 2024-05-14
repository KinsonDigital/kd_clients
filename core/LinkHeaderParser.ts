import { LinkHeader } from "./LinkHeader.ts";
import { PageInfo } from "./PageInfo.ts";
import { Utils } from "../deps.ts";

/**
 * Parses link headers to collect pagination information.
 */
export class LinkHeaderParser {
	private readonly pageNumRegex = /page=[0-9]+/gm;

	public toLinkHeader(responseOrHeaderString: Response | string): LinkHeader | null {
		const isString = typeof responseOrHeaderString === "string";

		const doesNotContainLinkHeader = isString
			? Utils.isNothing(responseOrHeaderString)
			: !responseOrHeaderString.headers.has("Link");

		if (doesNotContainLinkHeader) {
			return null;
		}

		const linkHeader = isString ? responseOrHeaderString : <string> responseOrHeaderString.headers.get("Link");

		const headerSections: string[] = Utils.splitByComma(linkHeader).map((i) => i.trim());
		const linkHeaderInfo: LinkHeader = {
			prevPage: 0,
			nextPage: 0,
			totalPages: 0,
			pageData: [],
		};

		for (const headerSection of headerSections) {
			const pageInfoSections: string[] = Utils.splitBy(headerSection, ";").map((i) => i.trim());
			const pageUrl: string = pageInfoSections[0].trim();
			const metadata: string = pageInfoSections[1].trim();

			const pageInfo: PageInfo = {
				pageUrl: pageUrl,
				metadata: metadata,
			};

			linkHeaderInfo.pageData.push(pageInfo);

			if (this.isPrev(pageInfo)) {
				linkHeaderInfo.prevPage = this.getPageNumber(pageUrl);
			} else if (this.isNext(pageInfo)) {
				linkHeaderInfo.nextPage = this.getPageNumber(pageUrl);
			} else if (this.isLast(pageInfo)) {
				linkHeaderInfo.totalPages = this.getPageNumber(pageUrl);
			}
		}

		return linkHeaderInfo;
	}

	private isPrev(pageInfo: PageInfo): boolean {
		return pageInfo.metadata.includes('rel="prev"');
	}

	private isNext(pageInfo: PageInfo): boolean {
		return pageInfo.metadata.includes('rel="next"');
	}

	private isLast(pageInfo: PageInfo): boolean {
		return pageInfo.metadata.includes('rel="last"');
	}

	private getPageNumber(pageUrl: string): number {
		pageUrl = pageUrl.trim();

		const matches = pageUrl.match(this.pageNumRegex);

		return matches === null ? 0 : parseInt(Utils.splitBy(matches[0], "=")[1]);
	}

	private isResponse(responseOrHeaderString: Response | string): responseOrHeaderString is Response {
		return (<Response> responseOrHeaderString).headers !== undefined;
	}
}
