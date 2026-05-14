import { GitError } from "@gh-errors/GitError.ts";
import { IssueError } from "@gh-errors/IssueError.ts";
import { LabelError } from "@gh-errors/LabelError.ts";
import { MilestoneError } from "@gh-errors/MilestoneError.ts";
import { OrganizationError } from "@gh-errors/OrganizationError.ts";
import { ProjectError } from "@gh-errors/ProjectError.ts";
import { PullRequestError } from "@gh-errors/PullRequestError.ts";
import { ReleaseError } from "@gh-errors/ReleaseError.ts";
import { RepoError } from "@gh-errors/RepoError.ts";
import { TagError } from "@gh-errors/TagError.ts";
import { UsersError } from "@gh-errors/UsersError.ts";
import { WorkflowError } from "@gh-errors/WorkflowError.ts";
import { Utils } from "@core/Utils.ts";
import { AuthError } from "@gh-errors/AuthError.ts";
import { LinkHeaderParser } from "@core/LinkHeaderParser.ts";
import { WebApiClient } from "@core/WebApiClient.ts";
import { Guard } from "@core/Guard.ts";
import { sleep } from "@core/Sleep.ts";
import type { GetDataFunc } from "@core/Types.ts";

/**
 * Provides a base class for HTTP clients.
 */
export abstract class GitHubClient extends WebApiClient {
	private headerParser: LinkHeaderParser = new LinkHeaderParser();
	private _repoName = "";
	private _ownerName = "";
	private readonly defaultWaitTime = 1000 * 60; // Default 1 minute
	private primaryLimitAccumulatorMs = this.defaultWaitTime;

	/**
	 * Initializes a new instance of the {@link WebAPIClient} class.
	 * @param ownerName The name of the owner of the repository to use.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		super();

		this.ownerName = Utils.isNothing(ownerName) ? "" : ownerName.trim();
		this.repoName = Utils.isNothing(repoName) ? "" : repoName.trim();

		this.baseUrl = "https://api.github.com";
		this.updateOrAddHeader("Accept", "application/vnd.github+json");
		this.updateOrAddHeader("X-GitHub-Api-Version", "2022-11-28");

		if (!Utils.isNothing(token)) {
			this.updateOrAddHeader("Authorization", `Bearer ${token}`);
		}
	}

	/**
	 * Gets the name of the owner of the repository.
	 */
	public get ownerName(): string {
		return this._ownerName;
	}

	/**
	 * Sets the name of the owner of the repository.
	 */
	public set ownerName(v: string) {
		Guard.isNothing(v, "ownerName", "v");
		this._ownerName = v.trim();
	}

	/**
	 * Gets the name of the repository.
	 */
	public get repoName(): string {
		return this._repoName;
	}

	/**
	 * Sets the name of the repository.
	 */
	public set repoName(v: string) {
		Guard.isNothing(v, "repoName", "v");
		this._repoName = v.trim();
	}

	/**
	 * Resets the wait time to 60 seconds for use when the GitHub primary rate limit is reached.
	 */
	public resetLimitWaitTime(): void {
		this.primaryLimitAccumulatorMs = this.defaultWaitTime;
	}

	/**
	 * Returns a value indicating whether or not a token was provided.
	 * @returns True if a token was provided; otherwise, false.
	 */
	protected containsToken(): boolean {
		return this.containsHeader("Authorization");
	}

	/**
	 * Gets all data starting at the given {@link page} with a quantity for each page using the given {@link qtyPerPage}.
	 * @param getData The function to use to get the data for each page.
	 * @param qtyPerPage The quantity of items to get per page.
	 * @returns All of the data from the given {@link page}.
	 */
	protected async getAllData<T>(
		getData: GetDataFunc<T>,
		page = 1,
		qtyPerPage = 100,
	): Promise<T[]> {
		const allData: T[] = [];

		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		try {
			// Get data for the current page
			const [dataItems, response] = await getData(page, qtyPerPage);

			// Push the first page of data
			allData.push(...dataItems);

			const linkHeader = this.headerParser.toLinkHeader(response);
			const totalPagesLeft = linkHeader === null ? 1 : linkHeader?.totalPages ?? 0;

			if (totalPagesLeft > 0) {
				const dataRequests: Promise<[T[], Response]>[] = [];

				// Gather all of the requests promises
				for (let i = page + 1; i <= totalPagesLeft; i++) {
					const request = getData(i, qtyPerPage);

					dataRequests.push(request);
				}

				const responses: [T[], Response][] = await Promise.all(dataRequests);

				// Add the rest of the pages of data
				for (let i = 0; i < responses.length; i++) {
					const [pageData] = responses[i];

					allData.push(...pageData);
				}
			} else if (linkHeader !== null && linkHeader.nextPage > 0) {
				let nextPage = linkHeader.nextPage;

				while (nextPage > 0) {
					const [pageData, nextResponse] = await getData(nextPage, qtyPerPage);

					allData.push(...pageData);

					const nextLinkHeader = this.headerParser.toLinkHeader(nextResponse);
					nextPage = nextLinkHeader?.nextPage ?? 0;
				}
			}
		} catch (error) {
			const errorMsg = this.isKnownGitHubError(error)
				? `There was an issue getting all of the data using pagination.\n${error.message}`
				: "An error occurred while getting all of the data.";

			throw new Error(errorMsg);
		}

		return allData;
	}

	/**
	 * Gets all data starting at the given {@link page} with a quantity for each page using the given {@link qtyPerPage},
	 * until the given {@link getData} predicate returns true.
	 * @param getData The function to use to get the data for each page.
	 * @param qtyPerPage The quantity of items to get per page.
	 * @returns All of the data from the given {@link page}.
	 */
	protected async getAllDataUntil<T>(
		getData: GetDataFunc<T>,
		page = 1,
		qtyPerPage = 100,
		until: (pageOfData: T[]) => boolean,
	): Promise<T[]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		try {
			// Get data for the current page
			const [dataItems, response] = await getData(page, qtyPerPage);

			// If the until predicate returns true on the first page,
			// then there is no need to get any more data.
			if (until(dataItems)) {
				return dataItems;
			}

			const linkHeader = this.headerParser.toLinkHeader(response);
			const totalPagesLeft = linkHeader?.totalPages ?? 0;

			if (totalPagesLeft > 0) {
				let [groupA, groupB] = this.createAlternatePagesGroups(totalPagesLeft);

				// Remove the starting page and any pages before it, these have already been pulled
				groupA = groupA.filter((i) => i > page);
				groupB = groupB.filter((i) => i > page);

				const maxLen = Math.max(groupA.length, groupB.length);

				const requests: Promise<[T[], Response]>[] = [];

				for (let i = 0; i < maxLen; i++) {
					if (i <= groupA.length - 1) {
						const currentPageA = groupA[i];

						requests.push(getData(currentPageA, qtyPerPage));
					}

					if (i <= groupB.length - 1) {
						const currentPageB = groupB[i];

						requests.push(getData(currentPageB, qtyPerPage));
					}

					// Wait for both requests from each group to finish
					const [groupResultA, groupResultB] = await Promise.all(requests);

					const groupItemsA = groupResultA === undefined ? [] : groupResultA[0];

					// Does the result from group A contain the data
					if (groupItemsA.length > 0 && until(groupItemsA)) {
						return groupItemsA;
					}

					const groupItemsB = groupResultB === undefined ? [] : groupResultB[0];

					// Does the result from group B contain the data
					if (groupItemsB.length > 0 && until(groupItemsB)) {
						return groupItemsB;
					}

					// Clear all of the items
					requests.length = 0;
				}
			} else if (linkHeader !== null && linkHeader.nextPage > 0) {
				// rel="last" is absent (cursor-based pagination): follow rel="next" sequentially
				let nextPage = linkHeader.nextPage;

				while (nextPage > 0) {
					const [pageData, nextResponse] = await getData(nextPage, qtyPerPage);

					if (until(pageData)) {
						return pageData;
					}

					const nextLinkHeader = this.headerParser.toLinkHeader(nextResponse);
					nextPage = nextLinkHeader?.nextPage ?? 0;
				}
			}

			return [];
		} catch (error) {
			const errorMsg = this.isKnownGitHubError(error)
				? `There was an issue getting all of the data using pagination.\n${error.message}`
				: "An error occurred while getting all of the data.";

			throw new Error(errorMsg);
		}
	}

	/**
	 * Gets all data starting at the given {@link page} with a quantity for each using the given {@link qtyPerPage},
	 * with each page of data being filtered with the given {@link getData} function.
	 * @param getData The function to use to get the data for each page.
	 * @param qtyPerPage The quantity of items to get per page.
	 * @returns All of the data from the given {@link page}.
	 */
	protected async getAllFilteredData<T>(
		getData: GetDataFunc<T>,
		page = 1,
		qtyPerPage = 100,
		filter: (pageOfData: T[]) => T[],
	): Promise<T[]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		try {
			return filter(await this.getAllData(getData, page, qtyPerPage));
		} catch (error) {
			const errorMsg = this.isKnownGitHubError(error)
				? `There was an issue getting all of the data using pagination.\n${error.message}`
				: "An error occurred while getting all of the data using pagination.";

			throw new Error(errorMsg);
		}
	}

	/**
	 * @inheritdoc
	 * @remarks Intercepts the request process primary and secondary rate limits.
	 */
	public override async requestGET(url: string): Promise<Response> {
		while (this.TotalRequestsRunning >= 100) {
			await sleep(5000);
		}

		const response = await super.requestGET(url);
		await this.processRateLimits(response);

		return response;
	}

	/**
	 * @inheritdoc
	 * @param [skipRateLimits=false] True to skip processing the rate limits.
	 * @remarks Intercepts the request process primary and secondary rate limits.
	 */
	public override async requestPOST(
		url: string,
		body: string | object | Uint8Array,
		skipRateLimits = false,
	): Promise<Response> {
		while (this.TotalRequestsRunning >= 100) {
			await sleep(1000);
		}

		const response = await super.requestPOST(url, body);

		await this.processRateLimits(response, skipRateLimits);

		return response;
	}

	/**
	 * @inheritdoc
	 * @param [skipRateLimits=false] True to skip processing the rate limits.
	 * @remarks Intercepts the request process primary and secondary rate limits.
	 */
	public override async requestPATCH(url: string, body: string, skipRateLimits = false): Promise<Response> {
		while (this.TotalRequestsRunning >= 100) {
			await sleep(1000);
		}

		const response = await super.requestPATCH(url, body);
		await this.processRateLimits(response, skipRateLimits);

		return response;
	}

	/**
	 * @inheritdoc
	 * @remarks Intercepts the request process primary and secondary rate limits.
	 */
	public override async requestDELETE(url: string): Promise<Response> {
		while (this.TotalRequestsRunning >= 100) {
			await sleep(1000);
		}

		const response = await super.requestDELETE(url);
		await this.processRateLimits(response);

		return response;
	}

	/**
	 * @inheritdoc
	 * @remarks Intercepts the request process primary and secondary rate limits.
	 */
	public override async requestPUT(url: string, body: string): Promise<Response> {
		while (this.TotalRequestsRunning >= 100) {
			await sleep(1000);
		}

		const response = await super.requestPUT(url, body);
		await this.processRateLimits(response);

		return response;
	}

	/**
	 * Processes any rate limits that are returned in the response headers.
	 * @param response The response to process the rate limits for.
	 * @returns A promise that resolves when the rate limits have been processed.
	 */
	private async processRateLimits(response: Response, skipRateLimits = false): Promise<void> {
		if (skipRateLimits) {
			return;
		}

		const rateLimit = response.headers.get("x-ratelimit-limit");
		const rateRemaining = response.headers.get("x-ratelimit-remaining");
		const rateResetEpochSeconds = response.headers.get("x-ratelimit-reset");
		const rateResource = response.headers.get("x-ratelimit-resource");
		const rateUsed = response.headers.get("x-ratelimit-used");
		const retryAfter = response.headers.get("retry-after");

		if (retryAfter !== null) {
			const retryAfterMs = parseInt(retryAfter) * 1000;

			this.showRateLimitWarning(response);

			await sleep(retryAfterMs);

			return;
		}

		// If any of the header values are null, rate limits cannot be processed
		if (
			rateLimit === null || rateRemaining === null || rateResetEpochSeconds === null || rateResource === null ||
			rateUsed === null
		) {
			return;
		}

		const primaryLimitReached = rateRemaining === "0" && (response.status === 403 || response.status === 429);

		if (primaryLimitReached) {
			this.showRateLimitWarning(response);

			await sleep(this.primaryLimitAccumulatorMs);

			// Next time, wait for an additional 20%
			this.primaryLimitAccumulatorMs += this.primaryLimitAccumulatorMs * 0.20;
		}
	}

	/**
	 * Uses the response to show a warning about the rate limit being reached.
	 * @param response The response containing the rate limit headers.
	 */
	private showRateLimitWarning(response: Response): void {
		const rateLimit = response.headers.get("x-ratelimit-limit");
		const rateRemaining = response.headers.get("x-ratelimit-remaining");
		const rateResetEpochSeconds = response.headers.get("x-ratelimit-reset");
		const rateResource = response.headers.get("x-ratelimit-resource");
		const rateUsed = response.headers.get("x-ratelimit-used");

		// If any of the header values are null, rate limits cannot be shown
		if (
			rateLimit === null || rateRemaining === null || rateResetEpochSeconds === null || rateResource === null ||
			rateUsed === null
		) {
			return;
		}

		const resetSec = Math.abs(parseInt(rateResetEpochSeconds) - Math.floor(Date.now() / 1000)).toFixed(1);

		const warning = "%cGitHub Rate Limit Reached!" +
			`\nWaiting for ${this.primaryLimitAccumulatorMs / 1000} seconds before continuing.` +
			"\nMore info: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28" +
			"\n\thttps://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28" +
			`\nRate Limit: ${rateLimit}` +
			`\nRemaining: ${rateRemaining}` +
			`\nReset Time(s): ${resetSec}` +
			`\nResource: ${rateResource}` +
			`\nUsed: ${rateUsed}`;

		console.warn(`%c${warning}`, "color: yellow");
	}

	/**
	 * Creates 2 groups of pages from the given {@link totalPages}.
	 * @param totalPages The total number of pages to create groups from.
	 * @returns The first and second half of the pages.
	 * @remarks The first half of pages will be in ascending order, while the second half will be in descending order.
	 * This will make sure that when requests are fired from both groups, the requests will be made in an alternating order.
	 */
	private createAlternatePagesGroups(totalPages: number): [number[], number[]] {
		const firstHalf: number[] = [];
		const secondHalf: number[] = [];

		const firstHalfEndingIndex = Math.floor(totalPages / 2);

		for (let i = 1; i <= totalPages; i++) {
			if (i <= firstHalfEndingIndex) {
				firstHalf.push(i);
			} else {
				secondHalf.push(i);
			}
		}

		secondHalf.reverse();

		return [firstHalf, secondHalf];
	}

	/**
	 * Returns a value indicating whether the given {@link error} is a valid GitHub error.
	 * @param error The error to check.
	 * @returns True if the error is a known GitHub error; otherwise, false.
	 */
	private isKnownGitHubError(
		error: unknown,
	): error is
		| AuthError
		| GitError
		| IssueError
		| LabelError
		| MilestoneError
		| OrganizationError
		| ProjectError
		| PullRequestError
		| ReleaseError
		| RepoError
		| TagError
		| UsersError
		| WorkflowError {
		return error instanceof AuthError || error instanceof GitError || error instanceof IssueError ||
			error instanceof LabelError || error instanceof MilestoneError || error instanceof OrganizationError ||
			error instanceof ProjectError || error instanceof PullRequestError || error instanceof ReleaseError ||
			error instanceof RepoError || error instanceof TagError || error instanceof UsersError ||
			error instanceof WorkflowError;
	}
}
