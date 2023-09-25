import { LabelModel } from "../core/Models/LabelModel.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { Guard } from "../core/Guard.ts";

/**
 * Provides a client for interacting with labels.
 */
export class LabelClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link LabelClient} class.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no {@link token} is provided, then the client will not be authenticated.
	 */
	constructor(token?: string) {
		super(token);
	}

	/**
	 * Gets a page of labels with a set page size for a repository that matches the {@link repoName}.
	 * @param repoName The name of the repo where the labels exist.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @returns A list of labels in the repo.
	 * @remarks Does not require authentication.
	 */
	public async getLabels(repoName: string, page: number, qtyPerPage: number): Promise<[LabelModel[], Response]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getLabels", "repoName");

		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/labels${queryParams}`;
		const response: Response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.NotFound) {
			Utils.printAsGitHubError(`${response.status} - ${response.statusText}`);
			Deno.exit(1);
		}

		return [await this.getResponseData(response), response];
	}

	/**
	 * Gets a list of all the labels for a repository with a name that matches the {@link repoName}.
	 * @param repoName The name of the repository that contains the labels.
	 * @returns The list of repository labels.
	 */
	public async getAllLabels(repoName: string): Promise<LabelModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getAllLabels", "repoName");

		const result: LabelModel[] = [];

		await this.getAllData(async (page, qtyPerPage) => {
			const [labels, response] = await this.getLabels(repoName, page, qtyPerPage ?? 100);

			result.push(...labels);

			return [labels, response];
		});

		return result;
	}

	/**
	 * Returns a value indicating whether or not given {@link label} exists in
	 * a repo that matches the {@link repoName}.
	 * @param repoName The name of the repo where the labels exist.
	 * @param label The name of the label to check for.
	 * @returns True if the label exists, false otherwise.
	 * @remarks Does not require authentication.
	 */
	public async labelExists(repoName: string, label: string): Promise<boolean> {
		const funcName = "labelExists";
		Guard.isNullOrEmptyOrUndefined(label, funcName, "label");
		Guard.isNullOrEmptyOrUndefined(label, funcName, "label");

		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/labels/${label}`;
		const response: Response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.NotFound) {
			return false;
		} else if (response.status === GitHubHttpStatusCodes.OK) {
			return true;
		} else {
			let errorMsg = `There was an issue getting the repository label '${label}'.`;
			errorMsg += `Error: ${response.status} - ${response.statusText}`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}
}
