import { decode, encode } from "https://deno.land/std@0.194.0/encoding/base64.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { Guard } from "../core/Guard.ts";
import { FileContentModel } from "../core/Models/FileContentModel.ts";
import { RepoModel } from "../core/Models/RepoModel.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubVarModel } from "../core/Models/GitHubVarModel.ts";
import { GitHubVariablesModel } from "../core/Models/GitHubVariablesModel.ts";

/**
 * Provides a client for interacting with GitHub repositories.
 */
export class RepoClient extends GitHubClient {
	private readonly newLineBase64 = encode("\n");
	private readonly carriageReturnBase64 = encode("\r");

	/**
	 * Initializes a new instance of the {@link RepoClient} class.
	 * @param token The GitHub token to use for authentication.
	 */
	constructor(token?: string) {
		super(token);
	}

	/**
	 * Gets a repository with the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @returns A repository.
	 */
	public async getRepoByName(repoName: string): Promise<RepoModel> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getRepoByName", "repoName");

		repoName = repoName.trim().toLowerCase();

		const foundRepos = await this.getAllDataUntil<RepoModel>(
			async (page, qtyPerPage) => {
				return await this.getUserRepos(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: RepoModel[]) => {
				return pageOfData.some((repo) => repo.name.trim().toLowerCase() === repoName);
			},
		);

		const foundRepo: RepoModel | undefined = foundRepos.find((repo) => repo.name.trim().toLowerCase() === repoName);

		if (foundRepo === undefined) {
			Utils.printAsGitHubError(`The repository '${repoName}' was not found.`);
			Deno.exit(1);
		}

		return foundRepo;
	}

	/**
	 * Gets a {@link page} of repositories with the {@link qtyPerPage}.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns A list of repositories.
	 * @remarks The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 */
	public async getUserRepos(page: number, qtyPerPage: number): Promise<[RepoModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/users/${this.organization}/repos${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			let errorMsg = `Not found. Check that the repository owner '${this.organization}' is a valid repository owner.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;
			Utils.printAsGitHubError(errorMsg);

			Deno.exit(1);
		}

		return [<RepoModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Checks if a repo exists.
	 * @param repoName The name of the repo to check.
	 * @returns True if the repo exists; otherwise, false.
	 */
	public async exists(repoName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(repoName, "repoExists", "repoName");

		repoName = repoName.trim();

		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			return false;
		}

		switch (response.status) {
			case GitHubHttpStatusCodes.MovedPermanently:
			case GitHubHttpStatusCodes.Forbidden: {
				const errorMsg = `Error: ${response.status} (${response.statusText})`;
				Utils.printAsGitHubError(errorMsg);
				Deno.exit(1);
			}
		}

		return true;
	}

	/**
	 * Gets the content of a file at the given {@link relativeFilePath} in a repository with a name
	 * that matches the given {@link repoName}.
	 * @param repoName The name of the repository to check.
	 * @param relativeFilePath The relative path of the file.
	 * @returns The content of the file.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 */
	public async getFileContent(repoName: string, branchName: string, relativeFilePath: string): Promise<string> {
		const funcName = "getFileContent";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const fileContentModel = await this.getFileContentResult(repoName, branchName, relativeFilePath);

		if (fileContentModel === undefined || fileContentModel === null) {
			Utils.printAsGitHubError("Error: 404(Not Found)");
			Deno.exit(1);
		}

		const decodedContent = decode(fileContentModel.content);

		// Return the file content after it has been decoded from base64
		const decodedFileContent = new TextDecoder().decode(decodedContent);

		return decodedFileContent;
	}

	/**
	 * Gets a value indicating whether or not a file exists with the given {@link relativeFilePath}
	 * in a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository to check.
	 * @param branchName The name of the branch to check.
	 * @param relativeFilePath The relative path of the file.
	 * @returns True if the file exists; otherwise, false.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 */
	public async fileExists(repoName: string, branchName: string, relativeFilePath: string): Promise<boolean> {
		const funcName = "fileExists";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const queryParams = `?ref=${branchName}`;
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/contents${relativeFilePath}${queryParams}`;

		const response: Response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.NotFound) {
			return false;
		}

		return true;
	}

	/**
	 * Gets a list of all the variables for a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @returns A list of all repositories variables.
	 */
	public async getVariables(repoName: string): Promise<GitHubVarModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getOrgVariables", "organization");

		return await this.getAllData<GitHubVarModel>(async (page: number, qtyPerPage?: number) => {
			const queryString = `?page=${page}&per_page=${qtyPerPage}`;
			const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/actions/variables${queryString}`;

			const response = await this.requestGET(url);

			if (response.status != GitHubHttpStatusCodes.OK) {
				let errorMsg = `An error occurred when getting the variables for the organization '${this.organization}'.`;
				errorMsg += `\nError: ${response.status}(${response.statusText})`;

				Utils.printAsGitHubError(errorMsg);
				Deno.exit(1);
			}

			const vars = await this.getResponseData<GitHubVariablesModel>(response);

			return [vars.variables, response];
		});
	}

	/**
	 * Gets a value indicating whether or not a variable exists with a name that matches the given {@link variableName}
	 * in a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @param variableName The name of the variable.
	 * @returns True if the variable exists; otherwise, false.
	 */
	public async repoVariableExists(repoName: string, variableName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(repoName, "repoVariableExists", "repoName");
		Guard.isNullOrEmptyOrUndefined(variableName, "repoVariableExists", "variableName");

		const variables = await this.getVariables(repoName);

		const variable = variables.find((v) => v.name === variableName);

		return variable !== undefined && variable !== null;
	}

	/**
	 * Updates a variable with a name that matches the given {@link variableName} in a repository with a name that
	 * matches the given {@link repoName} to the given {@link variableValue}.
	 * @param repoName The name of the repository.
	 * @param variableName The name of the variable.
	 * @param variableValue The value of the variable.
	 */
	public async updateVariable(repoName: string, variableName: string, variableValue: string): Promise<void> {
		const funcName = "updateVariable";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(variableName, funcName, "variableName");
		Guard.isNullOrEmptyOrUndefined(variableValue, funcName, "variableValue");

		if (!(await this.repoVariableExists(repoName, variableName))) {
			Utils.printAsGitHubError(`The variable '${variableName}' does not exist for the repository '${repoName}'.`);
			Deno.exit(1);
		}

		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/actions/variables/${variableName}`;

		const body = {
			name: variableName,
			value: variableValue,
		};

		const response = await this.requestPATCH(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.NoContent) {
			let errorMsg = `An error occurred when updating the variable '${variableName}' for the repository '${repoName}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Creates a new file in a repository with a name that matches the given {@link repoName}, on a branch
	 * that matches the given {@link branchName}, at the {@link relativeFilePath}, with the given {@link fileContent},
	 * with the given {@link commitMessage}.
	 * @param repoName The name of the repository.
	 * @param branchName The name of the branch.
	 * @param relativeFilePath The relative path of where to add the file.
	 * @param fileContent The content of the file.
	 * @param commitMessage The commit message.
	 */
	public async createFile(
		repoName: string,
		branchName: string,
		relativeFilePath: string,
		fileContent: string,
		commitMessage: string,
	): Promise<void> {
		const funcName = "createFile";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");
		Guard.isNullOrEmptyOrUndefined(fileContent, funcName, "fileContent");
		Guard.isNullOrEmptyOrUndefined(commitMessage, funcName, "commitMessage");

		relativeFilePath = Utils.normalizePath(relativeFilePath);
		Utils.trimAllStartingValue("/", relativeFilePath);

		const body = {
			message: commitMessage,
			content: encode(fileContent),
			branch: branchName,
		};
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/contents/${relativeFilePath}`;

		const response = await this.requestPUT(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.OK && response.status != GitHubHttpStatusCodes.Created) {
			let errorMsg = `An error occurred when creating the file '${relativeFilePath}' in the repository '${repoName}'`;
			errorMsg += ` for branch '${branchName}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Updates the content of a file in a repository with a name that matches the given {@link repoName}, on a branch
	 * that matches the given {@link branchName}, at the {@link relativeFilePath}, with the given {@link fileContent},
	 * with a commit message is the given {@link commitMessage}.
	 * @param repoName The name of the repository.
	 * @param branchName The name of the branch.
	 * @param relativeFilePath The relative path of where to add the file.
	 * @param fileContent The content of the file.
	 * @param commitMessage The commit message.
	 * @remarks If the file does not exist, an error will be thrown.
	 */
	public async updateFile(
		repoName: string,
		branchName: string,
		relativeFilePath: string,
		fileContent: string,
		commitMessage: string,
	): Promise<void> {
		const funcName = "updateFile";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");
		Guard.isNullOrEmptyOrUndefined(fileContent, funcName, "fileContent");
		Guard.isNullOrEmptyOrUndefined(commitMessage, funcName, "commitMessage");

		relativeFilePath = Utils.normalizePath(relativeFilePath);
		Utils.trimAllStartingValue("/", relativeFilePath);

		const fileContentModel = await this.getFileContentResult(repoName, branchName, relativeFilePath);

		if (fileContentModel === undefined || fileContentModel === null) {
			let errorMsg = `The file '${relativeFilePath}' does not exist in the repository`;
			errorMsg += `\n '${repoName}', in branch '${branchName}'.`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const body = {
			message: commitMessage,
			content: encode(fileContent),
			branch: branchName,
			sha: fileContentModel.sha,
		};
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/contents/${relativeFilePath}`;

		const response = await this.requestPUT(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.OK && response.status != GitHubHttpStatusCodes.Created) {
			let errorMsg = `An error occurred when creating the file '${relativeFilePath}' in the repository '${repoName}'`;
			errorMsg += ` for branch '${branchName}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Gets the content of a file and a value indicating whether or not the file exists, at the
	 * given {@link relativeFilePath} in a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository to check.
	 * @param relativeFilePath The relative path of the file.
	 * @returns The content of the file and a boolean flag indicating whether or not the file exists.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 */
	private async getFileContentResult(
		repoName: string,
		branchName: string,
		relativeFilePath: string,
	): Promise<FileContentModel | null> {
		const funcName = "getFileContentWithResult";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const queryParams = `?ref=${branchName}`;
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/contents${relativeFilePath}${queryParams}`;

		const response: Response = await this.requestGET(url);

		switch (response.status) {
			case GitHubHttpStatusCodes.NotFound:
				return null;
			case GitHubHttpStatusCodes.TemporaryRedirect:
			case GitHubHttpStatusCodes.Forbidden:
				Utils.printAsGitHubError(`Error: ${response.status} (${response.statusText})`);
				Deno.exit(1);
		}

		const responseData = <FileContentModel> await this.getResponseData(response);

		return responseData;
	}
}
