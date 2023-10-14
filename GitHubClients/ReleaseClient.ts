import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { Guard } from "../core/Guard.ts";
import { ReleaseModel } from "../core/Models/ReleaseModel.ts";
import { Utils } from "../core/Utils.ts";

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

			Utils.printError(errorMsg);

			Deno.exit(1);
		}

		return [<ReleaseModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Gets a release for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName},
	 * where the tag name matches the given {@link tagName}.
	 * @param tagName The tag of the release to get.
	 * @returns The release for the given repository and tag.
	 */
	public async getReleaseByTag(tagName: string): Promise<ReleaseModel> {
		const funcName = "getReleaseByTag";
		Guard.isNothing(tagName, funcName, "tagName");

		tagName = tagName.trim();

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the tag has been found, stop getting data.
				return pageOfData.some((item: ReleaseModel) => item.tag_name === tagName);
			},
		);

		const foundRelease: ReleaseModel | undefined = releases.find((item: ReleaseModel) => item.tag_name === tagName);

		if (foundRelease === undefined) {
			const errorMsg = `A release with the tag '${tagName}' for the repository '${this.repoName}' could not be found.`;
			Utils.printError(errorMsg);
			Deno.exit(1);
		}

		return foundRelease;
	}

	/**
	 * Gets a release for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName},
	 * where the name that the name of the release matches the given {@link releaseName}.
	 * @param releaseName The name of the release to get.
	 * @returns The release for the given repository and name.
	 */
	public async getReleaseByName(releaseName: string): Promise<ReleaseModel> {
		const funcName = "getReleaseByName";
		Guard.isNothing(releaseName, funcName, "releaseName");

		releaseName = releaseName.trim();

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the name has been found, stop getting data.
				return pageOfData.some((item: ReleaseModel) => item.name === releaseName);
			},
		);

		const foundRelease: ReleaseModel | undefined = releases.find((item: ReleaseModel) => item.name === releaseName);

		if (foundRelease === undefined) {
			const errorMsg = `A release with the name '${releaseName}' for the repository '${this.repoName}' could not be found.`;
			Utils.printError(errorMsg);
			Deno.exit(1);
		}

		return foundRelease;
	}

	/**
	 * Returns a value indicating whether or not a release is tied to a tag that matches the given {@link tagName},
	 * for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName}.
	 * @param tagName The name of the tag tied to the release.
	 * @returns The release for the given repository and name.
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
