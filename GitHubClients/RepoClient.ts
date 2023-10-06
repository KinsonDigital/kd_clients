import { decodeBase64, encodeBase64 } from "encoding/base64.ts";
import { GitHubHttpStatusCodes } from "core/Enums.ts";
import { GitHubClient } from "core/GitHubClient.ts";
import { Guard } from "core/Guard.ts";
import { FileContentModel } from "models/FileContentModel.ts";
import { RepoModel } from "models/RepoModel.ts";
import { Utils } from "core/Utils.ts";
import { GitHubVarModel } from "models/GitHubVarModel.ts";
import { GitHubVariablesModel } from "models/GitHubVariablesModel.ts";

/**
 * Provides a client for interacting with GitHub repositories.
 */
export class RepoClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link RepoClient} class.
	 * @param repoOwner The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 */
	constructor(repoOwner: string, repoName: string, token?: string) {
		super(repoOwner, repoName, token);
	}

	/**
	 * Gets information about a repository with a name that matches the given {@link RepoClient}/{@link repoName}.
	 * @returns A repository.
	 */
	public async getRepoByName(): Promise<RepoModel> {
		const foundRepos = await this.getAllDataUntil<RepoModel>(
			async (page, qtyPerPage) => {
				return await this.getUserRepos(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: RepoModel[]) => {
				return pageOfData.some((repo) => repo.name.trim().toLowerCase() === this.repoName);
			},
		);

		const foundRepo: RepoModel | undefined = foundRepos.find((repo) => repo.name.trim().toLowerCase() === this.repoName);

		if (foundRepo === undefined) {
			Utils.printAsGitHubError(`The repository '${this.repoName}' was not found.`);
			Deno.exit(1);
		}

		return foundRepo;
	}

	/**
	 * Gets a {@link page} of repositories with a quantity that matches the given {@link qtyPerPage}.
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
		const url = `${this.baseUrl}/users/${this.ownerName}/repos${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			let errorMsg = `Not found. Check that the repository owner '${this.ownerName}' is a valid repository owner.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;
			Utils.printAsGitHubError(errorMsg);

			Deno.exit(1);
		}

		return [<RepoModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Checks if a repository with a name that matches the {@link RepoClient}.{@link repoName} exists.
	 * @returns True if the repo exists; otherwise, false.
	 */
	public async exists(): Promise<boolean> {
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}`;

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
	 * that matches the given {@link RepoClient}.{@link repoName}.
	 * @param relativeFilePath The relative path of the file.
	 * @returns The content of the file.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 */
	public async getFileContent(branchName: string, relativeFilePath: string): Promise<string> {
		const funcName = "getFileContent";
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const fileContentModel = await this.getFileContentResult(branchName, relativeFilePath);

		if (fileContentModel === undefined || fileContentModel === null) {
			Utils.printAsGitHubError("Error: 404(Not Found)");
			Deno.exit(1);
		}

		const decodedContent = decodeBase64(fileContentModel.content);

		// Return the file content after it has been decoded from base64
		const decodedFileContent = new TextDecoder().decode(decodedContent);

		return decodedFileContent;
	}

	/**
	 * Gets a value indicating whether or not a file exists at the given {@link relativeFilePath}
	 * in a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @param branchName The name of the branch to check.
	 * @param relativeFilePath The relative path of the file.
	 * @returns True if the file exists; otherwise, false.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 */
	public async fileExists(branchName: string, relativeFilePath: string): Promise<boolean> {
		const funcName = "fileExists";
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const queryParams = `?ref=${branchName}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents${relativeFilePath}${queryParams}`;

		const response: Response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.NotFound) {
			return false;
		}

		return true;
	}

	/**
	 * Gets a list of all the variables for a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @returns A list of all repositories variables.
	 */
	public async getVariables(): Promise<GitHubVarModel[]> {
		return await this.getAllData<GitHubVarModel>(async (page: number, qtyPerPage?: number) => {
			const queryString = `?page=${page}&per_page=${qtyPerPage}`;
			const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/actions/variables${queryString}`;

			const response = await this.requestGET(url);

			if (response.status != GitHubHttpStatusCodes.OK) {
				let errorMsg = `An error occurred when getting the variables for the organization '${this.ownerName}'.`;
				errorMsg += `\nError: ${response.status}(${response.statusText})`;

				Utils.printAsGitHubError(errorMsg);
				Deno.exit(1);
			}

			const vars = await this.getResponseData<GitHubVariablesModel>(response);

			return [vars.variables, response];
		});
	}

	/**
	 * Gets a value indicating whether or not a variable with the given {@link variableName},
	 * in a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @param variableName The name of the variable.
	 * @returns True if the variable exists; otherwise, false.
	 */
	public async repoVariableExists(variableName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(variableName, "repoVariableExists", "variableName");

		const variables = await this.getVariables();

		const variable = variables.find((v) => v.name === variableName);

		return variable !== undefined && variable !== null;
	}

	/**
	 * Updates the value of a value to the given {@link variableValue} a variable with a name that matches
	 * the given {@link variableName} in a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @param variableName The name of the variable.
	 * @param variableValue The value of the variable.
	 */
	public async updateVariable(variableName: string, variableValue: string): Promise<void> {
		const funcName = "updateVariable";
		Guard.isNullOrEmptyOrUndefined(variableName, funcName, "variableName");
		Guard.isNullOrEmptyOrUndefined(variableValue, funcName, "variableValue");

		if (!(await this.repoVariableExists(variableName))) {
			Utils.printAsGitHubError(`The variable '${variableName}' does not exist for the repository '${this.repoName}'.`);
			Deno.exit(1);
		}

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/actions/variables/${variableName}`;

		const body = {
			name: variableName,
			value: variableValue,
		};

		const response = await this.requestPATCH(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.NoContent) {
			let errorMsg = `An error occurred when updating the variable '${variableName}' for the repository '${this.repoName}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Creates a new file in a repository with a name that matches the given {@link RepoClient}.{@link repoName}, on a branch
	 * that matches the given {@link branchName}, at the given {@link relativeFilePath}, and with the given {@link fileContent},
	 * with the given {@link commitMessage}.
	 * @param repoName The name of the repository.
	 * @param branchName The name of the branch.
	 * @param relativeFilePath The relative path of where to add the file.
	 * @param fileContent The content of the file.
	 * @param commitMessage The commit message.
	 */
	public async createFile(
		branchName: string,
		relativeFilePath: string,
		fileContent: string,
		commitMessage: string,
	): Promise<void> {
		const funcName = "createFile";
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");
		Guard.isNullOrEmptyOrUndefined(fileContent, funcName, "fileContent");
		Guard.isNullOrEmptyOrUndefined(commitMessage, funcName, "commitMessage");

		relativeFilePath = Utils.normalizePath(relativeFilePath);
		Utils.trimAllStartingValue("/", relativeFilePath);

		const body = {
			message: commitMessage,
			content: encodeBase64(fileContent),
			branch: branchName,
		};
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents/${relativeFilePath}`;

		const response = await this.requestPUT(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.OK && response.status != GitHubHttpStatusCodes.Created) {
			let errorMsg = `An error occurred when creating the file '${relativeFilePath}' in the repository '${this.repoName}'`;
			errorMsg += ` for branch '${branchName}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Updates the content of a file in a repository with a name that matches the given {@link RepoClient}.{@link repoName},
	 * on a branch that matches the given {@link branchName}, at the given {@link relativeFilePath}, with the given
	 * {@link fileContent}, and with the given {@link commitMessage}.
	 * @param branchName The name of the branch.
	 * @param relativeFilePath The relative path of where to add the file.
	 * @param fileContent The content of the file.
	 * @param commitMessage The commit message.
	 * @remarks If the file does not exist, an error will be thrown.
	 */
	public async updateFile(
		branchName: string,
		relativeFilePath: string,
		fileContent: string,
		commitMessage: string,
	): Promise<void> {
		const funcName = "updateFile";
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");
		Guard.isNullOrEmptyOrUndefined(fileContent, funcName, "fileContent");
		Guard.isNullOrEmptyOrUndefined(commitMessage, funcName, "commitMessage");

		relativeFilePath = Utils.normalizePath(relativeFilePath);
		Utils.trimAllStartingValue("/", relativeFilePath);

		const fileContentModel = await this.getFileContentResult(branchName, relativeFilePath);

		if (fileContentModel === undefined || fileContentModel === null) {
			let errorMsg = `The file '${relativeFilePath}' does not exist in the repository`;
			errorMsg += `\n '${this.repoName}', in branch '${branchName}'.`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const body = {
			message: commitMessage,
			content: encodeBase64(fileContent),
			branch: branchName,
			sha: fileContentModel.sha,
		};
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents/${relativeFilePath}`;

		const response = await this.requestPUT(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.OK && response.status != GitHubHttpStatusCodes.Created) {
			let errorMsg = `An error occurred when creating the file '${relativeFilePath}' in the repository '${this.repoName}'`;
			errorMsg += ` for branch '${branchName}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Gets the content of a file in a repository with a name that matches the given {@link RepoClient}.{@link repoName},
	 * on a branch with a name that matches the given {@link branchName} at the 	 * given {@link relativeFilePath}.
	 * @param relativeFilePath The relative path of the file.
	 * @returns The content of the file and a boolean flag indicating whether or not the file exists.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 */
	private async getFileContentResult(
		branchName: string,
		relativeFilePath: string,
	): Promise<FileContentModel | null> {
		const funcName = "getFileContentWithResult";
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const queryParams = `?ref=${branchName}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents${relativeFilePath}${queryParams}`;

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
