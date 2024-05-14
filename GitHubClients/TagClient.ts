import { Guard } from "../core/Guard.ts";
import { TagModel } from "../deps.ts";
import { Utils } from "../deps.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { TagError } from "../deps.ts";

/**
 * Provides a client for interacting with GitHub GIT tags.
 */
export class TagClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link TagClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "TagClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
	}

	/**
	 * Gets a {@link page} of tags for a repository.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns The tags.
	 * @remarks Does not require authentication.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 * @throws The {@link TagError} if there was an issue getting the tags.
	 */
	public async getTags(page: number, qtyPerPage: number): Promise<TagModel[]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const [tags, response] = await this.getTagsInternal(page, qtyPerPage);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			const errorMsg = this.buildErrorMsg("There was an issue getting the tags.", response);

			throw new TagError(errorMsg);
		}

		return tags;
	}

	/**
	 * Gets all of the tags in a repository with a name that matches the {@link TagClient}.{@link repoName}.
	 * @returns All of the tags.
	 * @throws The {@link TagError} if there was an issue getting all of the tags.
	 */
	public async getAllTags(): Promise<TagModel[]> {
		const result: TagModel[] = [];

		await this.getAllData(async (page: number, qtyPerPage?: number) => {
			const [tags, response] = await this.getTagsInternal(page, qtyPerPage ?? 100);

			result.push(...tags);

			return [tags, response];
		});

		return result;
	}

	/**
	 * Gets a tag with the given {@link tagName} in a repository with a name that matches the {@link TagClient}.{@link repoName}.
	 * @param tagName The name of the tag.
	 * @returns Returns the tag with the given name.
	 * @throws The {@link TagError} if there was an issue getting the tag.
	 */
	public async getTagByName(tagName: string): Promise<TagModel> {
		Guard.isNothing(tagName, "getTagByName", "tagName");

		tagName = tagName.trim();

		const foundTags = await this.getAllDataUntil<TagModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getTags(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: TagModel[]) => {
				return pageOfData.some((tag: TagModel) => tag.name.trim() === tagName);
			},
		);

		const foundTag = foundTags.find((tag: TagModel) => tag.name.trim() === tagName);

		if (foundTag === undefined) {
			throw new TagError(`The tag '${tagName}' could not be found.`);
		}

		return foundTag;
	}

	/**
	 * Searches for a tag with the given {@link tagName} in a repository that matches the {@link TagClient}.{@link repoName}.
	 * @param tagName The name of the tag.
	 * @returns True if the tag exists, false otherwise.
	 * @throws The {@link TagError} if there was an issue checking if the tag exists.
	 */
	public async tagExists(tagName: string): Promise<boolean> {
		Guard.isNothing(tagName, "tagExists", "tagName");

		tagName = tagName.trim();

		const foundTags = await this.getAllDataUntil<TagModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getTags(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: TagModel[]) => {
				return pageOfData.some((tag: TagModel) => tag.name.trim() === tagName);
			},
		);

		return foundTags.length > 0;
	}

	/**
	 * Gets a {@link page} of tags for a repository.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns The tags.
	 * @remarks Does not require authentication.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 * @throws The {@link TagError} if there was an issue getting the tags.
	 */
	private async getTagsInternal(page: number, qtyPerPage: number): Promise<[TagModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/tags${queryParams}`;

		const response: Response = await this.requestGET(url);

		return [<TagModel[]> await this.getResponseData(response), response];
	}
}
