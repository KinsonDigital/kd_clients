import { Guard } from "../core/Guard.ts";
import { TagModel } from "../core/Models/TagModel.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";

/**
 * Provides a client for interacting with GitHub GIT tags.
 */
export class TagClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link TagClient} class.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(token?: string) {
		super(token);
	}

	/**
	 * Gets a {@link page} of tags for a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns The tags.
	 * @remarks Does not require authentication.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 */
	public async getTags(repoName: string, page: number, qtyPerPage: number): Promise<[TagModel[], Response]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getTags", "repoName");

		repoName = repoName.trim();
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/tags${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			Utils.printAsGitHubError(`${response.status} - ${response.statusText}`);
			Deno.exit(1);
		}

		return [<TagModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Gets all of the tags for a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @returns All of the tags.
	 */
	public async getAllTags(repoName: string): Promise<TagModel[]> {
		const result: TagModel[] = [];

		await this.getAllData(async (page: number, qtyPerPage?: number) => {
			const [tags, response] = await this.getTags(repoName, page, qtyPerPage ?? 100);

			result.push(...tags);

			return [tags, response];
		});

		return result;
	}

	/**
	 * Gets a tag with the given {@link tagName} for a repository with the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @param tagName The name of the tag.
	 * @returns Returns the tag with the given name.
	 */
	public async getTagByName(repoName: string, tagName: string): Promise<TagModel> {
		const funcName = "getTagByName";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(tagName, funcName, "tagName");

		repoName = repoName.trim();
		repoName = repoName.trim();

		const foundTags = await this.getAllDataUntil<TagModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getTags(repoName, page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: TagModel[]) => {
				return pageOfData.some((tag: TagModel) => tag.name.trim() === tagName);
			},
		);

		const foundTag = foundTags.find((tag: TagModel) => tag.name.trim() === tagName);

		if (foundTag === undefined) {
			Utils.printAsGitHubError(`The tag '${tagName}' could not be found.`);
			Deno.exit(1);
		}

		return foundTag;
	}

	/**
	 * Searches for a tag with the given {@link tagName} for a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @param tagName The name of the tag.
	 * @returns True if the tag exists, false otherwise.
	 */
	public async tagExists(repoName: string, tagName: string): Promise<boolean> {
		const funcName = "tagExists";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(tagName, funcName, "tagName");

		repoName = repoName.trim();
		tagName = tagName.trim();

		const foundTags = await this.getAllDataUntil<TagModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getTags(repoName, page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: TagModel[]) => {
				return pageOfData.some((tag: TagModel) => tag.name.trim() === tagName);
			},
		);

		return foundTags.length > 0;
	}
}
