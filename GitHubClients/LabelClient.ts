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
	 * @param ownerName The name of the owner of the repository to use.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no {@link token} is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "LabelClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(token);
	}

	/**
	 * Gets the given {@link page} of labels where the size of each page is the given {@link qtyPerPage},
	 * for a repository with a name that matches the {@link repoName}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @returns A list of labels in the repo.
	 * @remarks Does not require authentication.
	 */
	public async getLabels(page: number, qtyPerPage: number): Promise<[LabelModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/labels${queryParams}`;
		const response: Response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.NotFound) {
			Utils.printAsGitHubError(`${response.status} - ${response.statusText}`);
			Deno.exit(1);
		}

		return [await this.getResponseData(response), response];
	}

	/**
	 * Gets all of the labels for a repository with a name that matches the {@link LabelClient}.{@link repoName}.
	 * @returns The list of repository labels.
	 */
	public async getAllLabels(): Promise<LabelModel[]> {
		const result: LabelModel[] = [];

		await this.getAllData(async (page, qtyPerPage) => {
			const [labels, response] = await this.getLabels(page, qtyPerPage ?? 100);

			result.push(...labels);

			return [labels, response];
		});

		return result;
	}

	/**
	 * Returns a value indicating whether or not given {@link label} exists in a repository that matches
	 * the {@link LabelClient}.{@link repoName}.
	 * @param label The name of the label to check for.
	 * @returns True if the label exists, false otherwise.
	 * @remarks Does not require authentication.
	 */
	public async labelExists(label: string): Promise<boolean> {
		const funcName = "labelExists";
		Guard.isNothing(label, funcName, "label");

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/labels/${label}`;
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
