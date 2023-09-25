import { Guard } from "../core/Guard.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubHttpStatusCodes, WorkflowEvent, WorkflowRunStatus } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { WorkflowRunModel } from "../core/Models/WorkflowRunModel.ts";
import { WorkflowRunsModel } from "../core/Models/WorkflowRunsModel.ts";
import { AnyBranch } from "../core/Types.ts";
import { GithubResponse } from "./GithubResponse.ts";

/**
 * Provides a client for interacting with workflow runs.
 */
export class WorkflowClient extends GitHubClient {
	private readonly AnyBranch: AnyBranch = null;

	/**
	 * Initializes a new instance of the {@link WorkflowClient} class.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(token?: string) {
		super(token);
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} for the given {@link branch},
	 * that was triggered by the given {@link event}, and has the given {@link status}.
	 * @param repoName The name of the repository.
	 * @param branch The branch that contains the workflow runs.
	 * @param event The event that triggered the workflow runs.
	 * @param status The status of the workflow runs.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication if the repository is public.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 */
	public async getWorkflowRuns(
		repoName: string,
		branch: string | null | AnyBranch,
		event: WorkflowEvent,
		status: WorkflowRunStatus,
		page = 1,
		qtyPerPage = 100,
	): Promise<[WorkflowRunModel[], Response]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getWorkflowRuns", "repoName");

		repoName = repoName.trim();
		branch = branch?.trim() ?? "";
		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		// GitHub API: https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository
		const branchParam = Utils.isNullOrEmptyOrUndefined(branch) ? "" : `&branch=${branch}`;
		const eventParam = event === WorkflowEvent.any ? "" : `&event=${event}`;
		const statusParam = status === WorkflowRunStatus.any ? "" : `&status=${status}`;
		const queryParams = `?page=${page}&per_page=${qtyPerPage}${branchParam}${eventParam}${statusParam}`;
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/actions/runs${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			let errorMsg = `An error occurred trying to get the workflow runs for the repository '${repoName}'.`;
			errorMsg = `\n\tError: ${response.status}(${response.statusText})`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const workflowRuns: WorkflowRunsModel = await this.getResponseData(response);

		return [workflowRuns.workflow_runs, response];
	}

	public async getAllWorkflowRuns(repoName: string): Promise<WorkflowRunModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getAllWorkflowRuns", "repoName");

		return await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(
				repoName,
				this.AnyBranch,
				WorkflowEvent.any,
				WorkflowRunStatus.any,
				page,
				qtyPerPage,
			);
		});
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} and for the given {@link branch},
	 * that matches the given trigger {@link event}.
	 * @param repoName The name of the repository.
	 * @param branch The name of the branch where the workflow runs are located.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 */
	public async getCompletedWorkflowRunsByBranch(
		repoName: string,
		branch: string,
		event: WorkflowEvent,
	): Promise<WorkflowRunModel[]> {
		const funcName = "getCompletedWorkflowRunsByBranch";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branch, funcName, "branch");

		repoName = repoName.trim();
		branch = branch.trim();

		const workflowRuns = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(repoName, branch, event, WorkflowRunStatus.completed, page, qtyPerPage);
		});

		return workflowRuns;
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} and
	 * that matches the given trigger {@link event}.
	 * @param repoName The name of the repository.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 */
	public async getCompletedWorkflowRuns(repoName: string, event: WorkflowEvent): Promise<WorkflowRunModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getCompletedWorkflowRuns", "repoName");

		repoName = repoName.trim();

		const result = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(repoName, this.AnyBranch, event, WorkflowRunStatus.completed, page, qtyPerPage);
		});

		return result;
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} and for the given {@link branch},
	 * that matches the given trigger {@link event}.
	 * @param repoName The name of the repository.
	 * @param branch The name of the branch where the workflow runs are located.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 */
	public async getFailedWorkflowRunsByBranch(
		repoName: string,
		branch: string,
		event: WorkflowEvent,
	): Promise<WorkflowRunModel[]> {
		const funcName = "getFailedWorkflowRunsByBranch";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branch, funcName, "branch");

		repoName = repoName.trim();
		branch = branch.trim();

		const result = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(repoName, branch, event, WorkflowRunStatus.failure, page, qtyPerPage);
		});

		return result;
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} and
	 * that matches the given trigger {@link event}.
	 * @param repoName The name of the repository.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 */
	public async getFailedWorkflowRuns(repoName: string, event: WorkflowEvent): Promise<WorkflowRunModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getFailedWorkflowRuns", "repoName");

		repoName = repoName.trim();

		const result = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(repoName, this.AnyBranch, event, WorkflowRunStatus.failure, page, qtyPerPage);
		});

		return result;
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} and
	 * that matches the given trigger {@link event}.
	 * @param repoName The name of the repository.
	 * @param event The event that triggered the workflow runs.
	 * @param startDate The start date of when the workflow run was created.
	 * @param endDate The end date of when the workflow run was created.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 */
	public async getWorkflowRunsBetweenDates(repoName: string, startDate: Date, endDate: Date): Promise<WorkflowRunModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getWorkflowRunsBetweenDates", "repoName");

		repoName = repoName.trim();

		const result = await this.getAllFilteredData<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
					repoName,
					this.AnyBranch,
					WorkflowEvent.any,
					WorkflowRunStatus.any,
					page,
					qtyPerPage,
				);
			},
			1, // Start page
			100, // Qty per page,
			(pageOfData: WorkflowRunModel[]) => {
				return pageOfData.filter((workflowRun: WorkflowRunModel) => {
					const createdTime = new Date(workflowRun.created_at).getTime();
					const startTime = startDate.getTime();
					const endTime = endDate.getTime();

					return createdTime >= startTime && createdTime <= endTime;
				});
			},
		);

		return result;
	}

	/**
	 * Gets all workflow runs for a repository with a name that matches the given {@link repoName} and
	 * that matches the given {@link title}.
	 * @param repoName The name of the repository.
	 * @param title The title of the workflow runs.
	 * @returns The workflow runs.
	 */
	public async getAllWorkflowRunsByTitle(repoName: string, title: string): Promise<WorkflowRunModel[]> {
		const funcName = "getAllWorkflowRunsByTitle";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(title, funcName, "title");

		repoName = repoName.trim();
		title = title.trim();

		return await this.getAllFilteredData<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
					repoName,
					this.AnyBranch,
					WorkflowEvent.any,
					WorkflowRunStatus.any,
					page,
					qtyPerPage,
				);
			},
			1, // Start page
			100, // Qty per page,
			(pageOfData: WorkflowRunModel[]) => {
				return pageOfData.filter((workflowRun) => workflowRun.name.trim() === title);
			},
		);
	}

	/**
	 * Gets the first workflow run for a repository with a name that matches the given {@link repoName} and
	 * that matches the given {@link title}.
	 * @param repoName The name of the repository.
	 * @param title The title of the workflow run.
	 * @returns The workflow run.
	 */
	public async getWorkflowRunByTitle(repoName: string, title: string): Promise<WorkflowRunModel> {
		const funcName = "getWorkflowRunByTitle";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(title, funcName, "title");

		repoName = repoName.trim();
		title = title.trim();

		const workflowRuns = await this.getAllDataUntil<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
					repoName,
					this.AnyBranch,
					WorkflowEvent.any,
					WorkflowRunStatus.any,
					page,
					qtyPerPage,
				);
			},
			1, // Start page
			100, // Qty per page,
			(pageOfData: WorkflowRunModel[]) => {
				return pageOfData.some((workflowRun) => workflowRun.name.trim() === title);
			},
		);

		const workflowRun = workflowRuns.find((run) => run.display_title.trim() === title);

		if (workflowRun === undefined) {
			Utils.printAsGitHubError(`A workflow run with the title '${title}' was not found.`);
			Deno.exit(1);
		}

		return workflowRun;
	}

	/**
	 * Gets all workflow runs for a repository that matches the given {@link repoName} and for a pull request
	 * number that matches the given {@link prNumber}.
	 * @param repoName The name of the repository.
	 * @param prNumber The number of the pull request.
	 * @returns The workflow runs for a pull request number that matches the given {@link prNumber}.
	 * @remarks Does not require authentication.
	 */
	public async getWorkflowRunsForPR(repoName: string, prNumber: number): Promise<WorkflowRunModel[]> {
		const funcName = "getWorkflowRunsForPR";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isLessThanOne(prNumber, funcName, "prNumber");

		const result = await this.getAllDataUntil<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
					repoName,
					this.AnyBranch,
					WorkflowEvent.any,
					WorkflowRunStatus.any,
					page,
					qtyPerPage,
				);
			},
			1, // Start page
			100, // Qty per page,
			(pageOfData: WorkflowRunModel[]) => {
				return pageOfData.some((workflowRun: WorkflowRunModel) => {
					const containsPRData = workflowRun.pull_requests != null && workflowRun.pull_requests.length > 0;
					const prFound = workflowRun.pull_requests.some((pr) => pr.number === prNumber);

					return containsPRData && prFound;
				});
			},
		);

		// Filter out all of the items that are for the given pr
		return result.filter((workflowRun) => workflowRun.pull_requests.some((pr) => pr.number === prNumber));
	}

	/**
	 * Gets all of the workflow runs for a repository with a name that matches the given {@link repoName} and
	 * that are for a pull request.
	 * @param repoName The name of the repository.
	 * @returns All of the workflow runs that are for a pull request.
	 */
	public async getPullRequestWorkflowRuns(repoName: string): Promise<WorkflowRunModel[]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getPullRequestWorkflowRuns", "repoName");

		return await this.getAllFilteredData<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
					repoName,
					this.AnyBranch,
					WorkflowEvent.any,
					WorkflowRunStatus.any,
					page,
					qtyPerPage,
				);
			},
			1,
			100,
			(pageOfData: WorkflowRunModel[]) => {
				return pageOfData.filter((workflowRun) =>
					workflowRun.pull_requests != null && workflowRun.pull_requests.length > 0
				);
			},
		);
	}

	/**
	 * Deletes the given {@link workflowRun}.
	 * @param repoName The name of the repository.
	 * @remarks Requires authentication.
	 */
	public async deleteWorkflow(repoName: string, workflowRun: WorkflowRunModel): Promise<void> {
		Guard.isNullOrEmptyOrUndefined(repoName, "deleteWorkflow", "repoName");

		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/actions/runs/${workflowRun.id}`;

		const response: Response = await this.requestDELETE(url);

		// If there is an error
		switch (response.status) {
			case GitHubHttpStatusCodes.Forbidden:
			case GitHubHttpStatusCodes.NotFound: {
				let errorMsg = `An error occurred trying to delete the workflow run '${workflowRun.name}(${workflowRun.id})'`;
				errorMsg += `Error: ${response.status}(${response.statusText})`, Utils.printAsGitHubError(errorMsg);
				Deno.exit(1);
			}
		}
	}

	/**
	 * Executes a workflow that matches the given {@link workflowFileName} on a branch that matches the
	 * given {@link branchName} in a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository.
	 * @param branchName The name of the branch.
	 * @param workflowFileName The file name of the workflow.
	 */
	public async executeWorkflow(
		repoName: string,
		branchName: string,
		workflowFileName: string,
		inputs?: [string, string][],
	): Promise<void> {
		const funcName = "executeWorkflow";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(branchName, funcName, "branchName");
		Guard.isNullOrEmptyOrUndefined(workflowFileName, funcName, "workflowFileName");

		branchName = branchName.trim().toLowerCase();
		workflowFileName = workflowFileName.trim().toLowerCase();

		// If the workflow file name does not contain the correct extension
		if (!workflowFileName.endsWith(".yml") && !workflowFileName.endsWith(".yaml")) {
			let errorMsg = `The workflow file name '${workflowFileName}' does not contain the correct extension.`;
			errorMsg += `\nThe workflow file name must end with '.yml' or '.yaml'.`;
			Deno.exit(1);
		}

		let body = {};

		if (inputs === undefined) {
			inputs = [];
		}

		if (inputs.length <= 0) {
			body = { ref: branchName };
		} else {
			inputs.forEach((input) => {
				const workflowInput = input[0];

				if ((inputs?.filter((i) => workflowInput === i[0]).length ?? 0) > 1) {
					let errorMsg = `The workflow input '${workflowInput}' is duplicated.`;
					errorMsg += `\n\tWorkflow: ${workflowFileName}`;
					errorMsg += `\n\tBranch: ${branchName}`;
					errorMsg += `\n\tRepository: ${repoName}`;
					Utils.printAsGitHubError(errorMsg);
					Deno.exit(1);
				}
			});

			body = {
				ref: branchName,
				inputs: Object.fromEntries(inputs),
			};
		}

		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/actions/workflows/${workflowFileName}/dispatches`;

		const requestResponse: Response = await this.requestPOST(url, body);

		if (requestResponse.status != GitHubHttpStatusCodes.NoContent) {
			let errorMsg = "";
			switch (requestResponse.status) {
				case GitHubHttpStatusCodes.NotFound: {
					errorMsg = `The workflow '${workflowFileName}' could not be found on branch `;
					errorMsg += `'${branchName}' in the repository '${repoName}'.'`;
					errorMsg += `\n\tError: ${requestResponse.status}(${requestResponse.statusText})`;
					break;
				}
				case GitHubHttpStatusCodes.UnprocessableContent: {
					errorMsg = `The workflow '${workflowFileName}' on branch '${branchName}' in the repository `;
					errorMsg += `'${repoName}' was not processable.`;
					const githubResponse: GithubResponse = JSON.parse(await requestResponse.text());

					errorMsg += `\n\tError: ${requestResponse.status}(${requestResponse.statusText})`;
					errorMsg += `\n${githubResponse.message}\n${githubResponse.documentation_url}`;
					break;
				}
				default: {
					errorMsg = `An error occurred trying to execute the workflow '${workflowFileName}' on branch `;
					errorMsg += `'${branchName}' in the repository '${repoName}'.'`;
					errorMsg += `\n\tError: ${requestResponse.status}(${requestResponse.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
			}

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}
}
