import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { Guard } from "../core/Guard.ts";
import { ReleaseModel } from "../core/Models/mod.ts";
import { Utils } from "../core/Utils.ts";
import { ReleaseError } from "./Errors/ReleaseError.ts";
import { ReleaseOptions } from "./ReleaseOptions.ts";

/**
 * Provides a client for interacting with GitHub releases.
 */
export class ReleaseClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link ReleaseClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param this.repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "ReleaseClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
	}

	/**
	 * Gets the given {@link page} where each page quantity is the given {@link qtyPerPage},
	 *  for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName},
	 * @param this.repoName The name of the repository to get the releases for.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns The releases for the given repository and page.
	 * @remarks Does not require authentication if the repository is public.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 * @throws The {@link ReleaseError} if there was an issue getting the releases.
	 */
	public async getReleases(page: number, qtyPerPage: number): Promise<[ReleaseModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			let errorMsg = `The releases for the repository owner '${this.ownerName}'`;
			errorMsg += ` and for the repository '${this.repoName}' could not be found.`;

			throw new ReleaseError(errorMsg);
		}

		return [<ReleaseModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Gets a release for a repository.
	 * @param getByValue The tag or title of the release to get.
	 * @param options Various options to use when getting the release.
	 * @returns The release for a repository.
	 * @throws A {@link ReleaseError} if there was an issue getting the release or if it was not found.
	 */
	public async getRelease(getByValue: string, options?: ReleaseOptions): Promise<ReleaseModel> {
		Guard.isNothing(getByValue, "getRelease", "getByValue");

		getByValue = getByValue.trim();

		const filterPredicate: (item: ReleaseModel) => boolean = (item: ReleaseModel) => {
			return options?.getByTitle === true
				? item.name === getByValue
				: item.tag_name === getByValue;
		};

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the tag has been found, stop getting data.
				return pageOfData.some(filterPredicate);
			},
		);

		const foundRelease: ReleaseModel | undefined = releases.find(filterPredicate);

		if (foundRelease === undefined) {
			// TODO: Change message based if by tag or title
			const errorMsg = `A release with the tag '${getByValue}' for the repository '${this.repoName}' could not be found.`;
			throw new ReleaseError(errorMsg);
		}

		return foundRelease;
	}

	/**
	 * Returns a value indicating whether or not a release is tied to a tag that matches the given {@link tagName},
	 * for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName}.
	 * @param tagName The name of the tag tied to the release.
	 * @returns The release for the given repository and name.
	 * @throws The {@link ReleaseError} if there was an issue checking if the release exists.
	 */
	public async releaseExists(tagName: string): Promise<boolean> {
		const funcName = "releaseExists";
		Guard.isNothing(tagName, funcName, "releaseName");

		tagName = tagName.trim();

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the name has been found, stop getting data.
				return pageOfData.some((item: ReleaseModel) => item.tag_name === tagName);
			},
		);

		return releases.find((item: ReleaseModel) => item.tag_name === tagName) != undefined;
	}
}
