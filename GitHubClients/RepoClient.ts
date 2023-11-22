import { decodeBase64, encodeBase64 } from "../deps.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { Guard } from "../core/Guard.ts";
import { Utils } from "../core/Utils.ts";
import { FileContentModel } from "../core/Models/mod.ts";
import { RepoModel } from "../core/Models/mod.ts";
import { GitHubVarModel } from "../core/Models/mod.ts";
import { GitHubVariablesModel } from "../core/Models/mod.ts";
import { RepoError } from "./Errors/RepoError.ts";

/**
 * Provides a client for interacting with GitHub repositories.
 */
export class RepoClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link RepoClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		super(ownerName, repoName, token);
	}

	/**
	 * Gets information about a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @returns A repository information.
	 * @throws The {@link RepoError} if the repository does not exist.
	 */
	public async getRepo(): Promise<RepoModel> {
		const foundRepos = await this.getAllDataUntil<RepoModel>(
			async (page, qtyPerPage) => {
				return await this.getOwnerRepos(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: RepoModel[]) => {
				return pageOfData.some((repo) => repo.name.trim().toLowerCase() === this.repoName);
			},
		);

		const foundRepo: RepoModel | undefined = foundRepos.find((repo) => repo.name.trim().toLowerCase() === this.repoName);

		if (foundRepo === undefined) {
			throw new RepoError(`The repository '${this.repoName}' was not found.`);
		}

		return foundRepo;
	}

	/**
	 * Gets a {@link page} of repositories owned by the currently set {@link RepoClient}.{@link ownerName} with a quantity that
	 * matches the given {@link qtyPerPage}.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns A list of repositories.
	 * @remarks The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 * @throws The {@link RepoError} if the repository owner does not exist.
	 */
	public async getOwnerRepos(page: number, qtyPerPage: number): Promise<[RepoModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/users/${this.ownerName}/repos${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			const errorMsg = this.buildErrorMsg(
				`Not found. Check that the repository owner '${this.ownerName}' is a valid repository owner.`,
				response,
			);

			throw new RepoError(errorMsg);
		}

		return [<RepoModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Checks if a repository with a name that matches the {@link RepoClient}.{@link repoName} exists.
	 * @returns True if the repo exists; otherwise, false.
	 * @throws The {@link RepoError} if there was a problem checking if the repository exists.
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
				const errorMsg = this.buildErrorMsg(
					`There was a problem checking if the repository exists.`,
					response,
				);

				throw new RepoError(errorMsg);
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
	 * @throws The {@link RepoError} if there was a problem getting the file content.
	 */
	public async getFileContent(branchName: string, relativeFilePath: string): Promise<string> {
		const funcName = "getFileContent";
		Guard.isNothing(relativeFilePath, funcName, "relativeFilePath");

		const fileContentModel = await this.getFileContentResult(branchName, relativeFilePath);

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
	 * @throws The {@link RepoError} if there was problem checking if the file exists.
	 */
	public async fileExists(branchName: string, relativeFilePath: string): Promise<boolean> {
		const funcName = "fileExists";
		Guard.isNothing(branchName, funcName, "branchName");
		Guard.isNothing(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const queryParams = `?ref=${branchName}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents${relativeFilePath}${queryParams}`;

		const response: Response = await this.requestGET(url);

		if (response.status != GitHubHttpStatusCodes.OK) {
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				return false;
			} else {
				const errorMsg = this.buildErrorMsg(
					`There was a problem checking if the file '${relativeFilePath}' exists in the` +
						` repository '${this.repoName}' in the branch '${branchName}'.`,
					response,
				);

				throw new RepoError(errorMsg);
			}
		}

		return true;
	}

	/**
	 * Gets a list of all the variables for a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @returns A list of all repositories variables.
	 * @throws The {@link RepoError} if there was a problem getting the variables.
	 */
	public async getVariables(): Promise<GitHubVarModel[]> {
		return await this.getAllData<GitHubVarModel>(async (page: number, qtyPerPage?: number) => {
			const queryString = `?page=${page}&per_page=${qtyPerPage}`;
			const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/actions/variables${queryString}`;

			const response = await this.requestGET(url);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the variables for the owner '${this.ownerName}'.`,
					response,
				);

				throw new RepoError(errorMsg);
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
	 * @throws The {@link RepoError} if there was a problem checking if the variable exists.
	 */
	public async repoVariableExists(variableName: string): Promise<boolean> {
		Guard.isNothing(variableName, "repoVariableExists", "variableName");

		const variables = await this.getVariables();
		const variable = variables.find((v) => v.name === variableName);

		return variable != undefined && variable != null;
	}

	/**
	 * Updates the value of a value to the given {@link variableValue} a variable with a name that matches
	 * the given {@link variableName} in a repository with a name that matches the given {@link RepoClient}.{@link repoName}.
	 * @param variableName The name of the variable.
	 * @param variableValue The value of the variable.
	 * @throws The {@link RepoError} if there was a problem updating the variable or if the variable does not exist.
	 */
	public async updateVariable(variableName: string, variableValue: string): Promise<void> {
		const funcName = "updateVariable";
		Guard.isNothing(variableName, funcName, "variableName");
		Guard.isNothing(variableValue, funcName, "variableValue");

		if (!(await this.repoVariableExists(variableName))) {
			throw new RepoError(`The variable '${variableName}' does not exist for the repository '${this.repoName}'.`);
		}

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/actions/variables/${variableName}`;

		const body = {
			name: variableName,
			value: variableValue,
		};

		const response = await this.requestPATCH(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.NoContent) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred when updating the variable '${variableName}'` +
					` for the repository '${this.repoName}'.`,
				response,
			);

			throw new RepoError(errorMsg);
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
	 * @throws The {@link RepoError} if there was a problem creating the file or if the file already exists.
	 */
	public async createFile(
		branchName: string,
		relativeFilePath: string,
		fileContent: string,
		commitMessage: string,
	): Promise<void> {
		const funcName = "createFile";
		Guard.isNothing(branchName, funcName, "branchName");
		Guard.isNothing(relativeFilePath, funcName, "relativeFilePath");
		Guard.isNothing(fileContent, funcName, "fileContent");
		Guard.isNothing(commitMessage, funcName, "commitMessage");

		relativeFilePath = Utils.normalizePath(relativeFilePath);
		Utils.trimAllStartingValue("/", relativeFilePath);

		if (await this.fileExists(branchName, relativeFilePath)) {
			const errorMsg = `The file '${relativeFilePath}' already exists in the repository '${this.repoName}'.`;
			throw new RepoError(errorMsg);
		}

		const body = {
			message: commitMessage,
			content: encodeBase64(fileContent),
			branch: branchName,
		};
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents/${relativeFilePath}`;

		const response = await this.requestPUT(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.OK && response.status != GitHubHttpStatusCodes.Created) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred when creating the file '${relativeFilePath}' in the repository '${this.repoName}'` +
					` for branch '${branchName}'.`,
				response,
			);

			throw new RepoError(errorMsg);
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
	 * @throws The {@link RepoError} if there was a problem updating the file or if the file does not exist.
	 */
	public async updateFile(
		branchName: string,
		relativeFilePath: string,
		fileContent: string,
		commitMessage: string,
	): Promise<void> {
		const funcName = "updateFile";
		Guard.isNothing(branchName, funcName, "branchName");
		Guard.isNothing(relativeFilePath, funcName, "relativeFilePath");
		Guard.isNothing(fileContent, funcName, "fileContent");
		Guard.isNothing(commitMessage, funcName, "commitMessage");

		relativeFilePath = Utils.normalizePath(relativeFilePath);
		Utils.trimAllStartingValue("/", relativeFilePath);

		if (await this.fileExists(branchName, relativeFilePath)) {
			const errorMsg = `The file '${relativeFilePath}' already exists in the repository '${this.repoName}'.`;
			throw new RepoError(errorMsg);
		}

		const fileContentModel = await this.getFileContentResult(branchName, relativeFilePath);

		const body = {
			message: commitMessage,
			content: encodeBase64(fileContent),
			branch: branchName,
			sha: fileContentModel.sha,
		};
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents/${relativeFilePath}`;

		const response = await this.requestPUT(url, JSON.stringify(body));

		if (response.status != GitHubHttpStatusCodes.OK && response.status != GitHubHttpStatusCodes.Created) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred when creating the file '${relativeFilePath}' in the repository '${this.repoName}'` +
					` for branch '${branchName}'.`,
				response,
			);

			throw new RepoError(errorMsg);
		}
	}

	/**
	 * Gets the content of a file in a repository with a name that matches the given {@link RepoClient}.{@link repoName},
	 * on a branch with a name that matches the given {@link branchName} at the given {@link relativeFilePath}.
	 * @param branchName The name of the branch.
	 * @param relativeFilePath The relative path of the file.
	 * @returns The content of the file and a boolean flag indicating whether or not the file exists.
	 * @remarks The {@link relativeFilePath} is relative to the root of the repository.
	 * @throws The {@link RepoError} if there was a problem getting the file content.
	 */
	private async getFileContentResult(
		branchName: string,
		relativeFilePath: string,
	): Promise<FileContentModel> {
		const funcName = "getFileContentWithResult";
		Guard.isNothing(branchName, funcName, "branchName");
		Guard.isNothing(relativeFilePath, funcName, "relativeFilePath");

		relativeFilePath = relativeFilePath.trim();
		relativeFilePath = relativeFilePath.startsWith("/") ? relativeFilePath : `/${relativeFilePath}`;

		const queryParams = `?ref=${branchName}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/contents${relativeFilePath}${queryParams}`;

		const response: Response = await this.requestGET(url);

		switch (response.status) {
			case GitHubHttpStatusCodes.NotFound:
			case GitHubHttpStatusCodes.TemporaryRedirect:
			case GitHubHttpStatusCodes.Forbidden: {
				const errorMsg = this.buildErrorMsg("There was an issue getting the file content", response);

				throw new RepoError(errorMsg);
			}
		}

		const responseData = <FileContentModel> await this.getResponseData(response);

		return responseData;
	}
}
