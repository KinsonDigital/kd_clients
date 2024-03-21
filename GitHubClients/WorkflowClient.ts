import { Guard } from "../core/Guard.ts";
import { Utils } from "../deps.ts";
import { GitHubHttpStatusCodes, WorkflowEvent, WorkflowRunStatus } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { WorkflowRunModel } from "../deps.ts";
import { WorkflowRunsModel } from "../deps.ts";
import { AnyBranch } from "../core/Types.ts";
import { GithubResponse } from "../GitHubClients/GithubResponse.ts";
import { WorkflowError } from "../deps.ts";

/**
 * Provides a client for interacting with workflow runs.
 */
export class WorkflowClient extends GitHubClient {
	private readonly AnyBranch: AnyBranch = null;

	/**
	 * Initializes a new instance of the {@link WorkflowClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "WorkflowClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
	}

	/**
	 * Gets all workflow runs for the given {@link branch}, with the given {@link event} and {@link status},
	 * for a repository with a name that matches the {@link WorkflowClient}.{@link repoName}.
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
	 * @throws The {@link WorkflowError} if there was an issue getting the workflow runs.
	 */
	public async getWorkflowRuns(
		branch: string | null | AnyBranch,
		event: WorkflowEvent,
		status: WorkflowRunStatus,
		page = 1,
		qtyPerPage = 100,
	): Promise<[WorkflowRunModel[], Response]> {
		branch = branch?.trim() ?? "";
		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		// GitHub API: https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository
		const branchParam = Utils.isNothing(branch) ? "" : `&branch=${branch}`;
		const eventParam = event === WorkflowEvent.any ? "" : `&event=${event}`;
		const statusParam = status === WorkflowRunStatus.any ? "" : `&status=${status}`;
		const queryParams = `?page=${page}&per_page=${qtyPerPage}${branchParam}${eventParam}${statusParam}`;
		const url = `${this.baseUrl}/repos/${this.repoName}/${this.repoName}/actions/runs${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred trying to get the workflow runs for the repository '${this.repoName}'.`,
				response,
			);

			throw new WorkflowError(errorMsg);
		}

		const workflowRuns: WorkflowRunsModel = await this.getResponseData(response);

		return [workflowRuns.workflow_runs, response];
	}

	/**
	 * Gets a list of all the workflow runs for a repository with a name that matches the {@link WorkflowClient}.{@link repoName}.
	 * @returns The list of workflow runs.
	 * @throws The {@link WorkflowError} if there was an issue getting all of the workflow runs.
	 */
	public async getAllWorkflowRuns(): Promise<WorkflowRunModel[]> {
		Guard.isNothing(this.repoName, "getAllWorkflowRuns", "repoName");

		return await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(
				this.AnyBranch,
				WorkflowEvent.any,
				WorkflowRunStatus.any,
				page,
				qtyPerPage,
			);
		});
	}

	/**
	 * Gets all completed workflow runs for the given {@link branch}, with the given {@link event},
	 * for a repository with a name that matches the {@link WorkflowClient}.{@link repoName}.
	 * @param branch The name of the branch where the workflow runs are located.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 * @throws The {@link WorkflowError} if there was an issue getting the completed workflow runs.
	 */
	public async getCompletedWorkflowRunsByBranch(
		branch: string,
		event: WorkflowEvent,
	): Promise<WorkflowRunModel[]> {
		Guard.isNothing(branch, "getCompletedWorkflowRunsByBranch", "branch");

		branch = branch.trim();

		const workflowRuns = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(branch, event, WorkflowRunStatus.completed, page, qtyPerPage);
		});

		return workflowRuns;
	}

	/**
	 * Gets all completed workflow runs that match the given {@link event}, for a repository with a name that
	 * matches the {@link WorkflowClient}.{@link repoName}.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 * @throws The {@link WorkflowError} if there was an issue getting the completed workflow runs.
	 */
	public async getCompletedWorkflowRuns(event: WorkflowEvent): Promise<WorkflowRunModel[]> {
		const result = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(this.AnyBranch, event, WorkflowRunStatus.completed, page, qtyPerPage);
		});

		return result;
	}

	/**
	 * Gets all failed workflow runs for the given {@link branch}, with the given {@link event},
	 * for a repository with a name that matches the {@link WorkflowClient}.{@link repoName}.
	 * that matches the given trigger {@link event}.
	 * @param branch The name of the branch where the workflow runs are located.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 * @throws The {@link WorkflowError} if there was an issue getting the failed workflow runs.
	 */
	public async getFailedWorkflowRunsByBranch(
		branch: string,
		event: WorkflowEvent,
	): Promise<WorkflowRunModel[]> {
		Guard.isNothing(branch, "getFailedWorkflowRunsByBranch", "branch");

		branch = branch.trim();

		const result = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(branch, event, WorkflowRunStatus.failure, page, qtyPerPage);
		});

		return result;
	}

	/**
	 * Gets all failed workflow runs that match the given {@link event}, for a repository with a name that matches
	 * the {@link WorkflowClient}.{@link repoName}.
	 * @param event The event that triggered the workflow runs.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 * @throws The {@link WorkflowError} if there was an issue getting the failed workflow runs.
	 */
	public async getFailedWorkflowRuns(event: WorkflowEvent): Promise<WorkflowRunModel[]> {
		Guard.isNothing("getFailedWorkflowRuns", "repoName");

		const result = await this.getAllData<WorkflowRunModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getWorkflowRuns(this.AnyBranch, event, WorkflowRunStatus.failure, page, qtyPerPage);
		});

		return result;
	}

	/**
	 * Gets all workflow runs between the given {@link startDate} and {@link endDate} for a repository with a name
	 * that matches the {@link WorkflowClient}.{@link repoName}.
	 * @param event The event that triggered the workflow runs.
	 * @param startDate The start date of when the workflow run was created.
	 * @param endDate The end date of when the workflow run was created.
	 * @returns The workflow runs.
	 * @remarks Does not require authentication.
	 * @throws The {@link WorkflowError} if there was an issue getting the workflow runs.
	 */
	public async getWorkflowRunsBetweenDates(startDate: Date, endDate: Date): Promise<WorkflowRunModel[]> {
		const result = await this.getAllFilteredData<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
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
	 * Gets all workflow with the given {@link title} for a repository with a name that matches
	 * the {@link WorkflowClient}.{@link repoName}.
	 * @param title The title of the workflow runs.
	 * @returns The workflow runs.
	 * @throws The {@link WorkflowError} if there was an issue getting the workflow runs.
	 */
	public async getAllWorkflowRunsByTitle(title: string): Promise<WorkflowRunModel[]> {
		const funcName = "getAllWorkflowRunsByTitle";
		Guard.isNothing(title, funcName, "title");

		title = title.trim();

		return await this.getAllFilteredData<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
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
	 * Gets the first workflow with the given {@link title} for a repository with a name that matches
	 * the {@link WorkflowClient}.{@link repoName}.
	 * @param title The title of the workflow run.
	 * @returns The workflow run.
	 * @throws The {@link WorkflowError} if there was an issue getting the workflow run.
	 */
	public async getWorkflowRunByTitle(title: string): Promise<WorkflowRunModel> {
		Guard.isNothing(title, "getWorkflowRunByTitle", "title");

		title = title.trim();

		const workflowRuns = await this.getAllDataUntil<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
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
			throw new WorkflowError(`A workflow run with the title '${title}' was not found.`);
		}

		return workflowRun;
	}

	/**
	 * Gets all workflow runs for a pull request with a number that matches the given {@link prNumber}, for a repository
	 * with a name that matches the {@link WorkflowClient}.{@link repoName}.
	 * @param prNumber The number of the pull request.
	 * @returns The workflow runs for a pull request number that matches the given {@link prNumber}.
	 * @remarks Does not require authentication.
	 * @throws The {@link WorkflowError} if there was an issue getting the workflow runs.
	 */
	public async getWorkflowRunsForPR(prNumber: number): Promise<WorkflowRunModel[]> {
		Guard.isLessThanOne(prNumber, "getWorkflowRunsForPR", "prNumber");

		const result = await this.getAllDataUntil<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
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
	 * Gets all of the workflow runs for pull requests for a repository with a name that matches the
	 * {@link WorkflowClient}.{@link repoName}.
	 * @returns All of the workflow runs that are for a pull request.
	 * @throws The {@link WorkflowError} if there was an issue getting the workflow runs.
	 */
	public async getPullRequestWorkflowRuns(): Promise<WorkflowRunModel[]> {
		return await this.getAllFilteredData<WorkflowRunModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getWorkflowRuns(
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
	 * Deletes the given {@link workflowRun} in a repository with a name that matches the {@link WorkflowClient}.{@link repoName}.
	 * @throws The {@link WorkflowError} if there was an issue deleting the workflow run.
	 * @remarks Requires authentication.
	 */
	public async deleteWorkflow(workflowRun: WorkflowRunModel): Promise<void> {
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/actions/runs/${workflowRun.id}`;

		const response: Response = await this.requestDELETE(url);

		// If there is an error
		switch (response.status) {
			case GitHubHttpStatusCodes.Forbidden:
			case GitHubHttpStatusCodes.NotFound: {
				const errorMsg = this.buildErrorMsg(
					`An error occurred trying to delete the workflow run '${workflowRun.name}(${workflowRun.id})'`,
					response,
				);

				throw new WorkflowError(errorMsg);
			}
		}
	}

	/**
	 * Executes a workflow that matches the given {@link workflowFileName} on a branch that matches the
	 * given {@link branchName} for a repository that matches the {@link WorkflowClient}.{@link repoName}.
	 * @param branchName The name of the branch.
	 * @param workflowFileName The file name of the workflow.
	 * @throws The {@link WorkflowError} if there was an issue executing the workflow.
	 */
	public async executeWorkflow(
		branchName: string,
		workflowFileName: string,
		inputs?: [string, string][],
	): Promise<void> {
		const funcName = "executeWorkflow";
		Guard.isNothing(branchName, funcName, "branchName");
		Guard.isNothing(workflowFileName, funcName, "workflowFileName");

		branchName = branchName.trim().toLowerCase();
		workflowFileName = workflowFileName.trim().toLowerCase();

		// If the workflow file name does not contain the correct extension
		if (!workflowFileName.endsWith(".yml") && !workflowFileName.endsWith(".yaml")) {
			let errorMsg = `The workflow file name '${workflowFileName}' does not contain the correct extension.`;
			errorMsg += `\nThe workflow file name must end with '.yml' or '.yaml'.`;
			throw new WorkflowError(errorMsg);
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
					errorMsg += `\n\tRepository: ${this.repoName}`;
					throw new WorkflowError(errorMsg);
				}
			});

			body = {
				ref: branchName,
				inputs: Object.fromEntries(inputs),
			};
		}

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/actions/workflows/${workflowFileName}/dispatches`;

		const response: Response = await this.requestPOST(url, body);

		if (response.status != GitHubHttpStatusCodes.NoContent) {
			let errorMsg = "";
			switch (response.status) {
				case GitHubHttpStatusCodes.NotFound: {
					errorMsg = this.buildErrorMsg(
						`The workflow '${workflowFileName}' could not be found on ` +
							`branch '${branchName}' in the repository '${this.repoName}'.'`,
						response,
					);
					break;
				}
				case GitHubHttpStatusCodes.UnprocessableContent: {
					errorMsg = `The workflow '${workflowFileName}' on branch '${branchName}' in the repository `;
					errorMsg += `'${this.repoName}' was not processable.`;
					const githubResponse: GithubResponse = JSON.parse(await response.text());
					errorMsg += `\n${githubResponse.message}\n${githubResponse.documentation_url}`;

					errorMsg = this.buildErrorMsg(errorMsg, response);

					break;
				}
				default: {
					errorMsg = this.buildErrorMsg(
						`An error occurred trying to execute the workflow '${workflowFileName}' on branch ` +
							`'${branchName}' in the repository '${this.repoName}'.'`,
						response,
					);
					break;
				}
			}

			throw new WorkflowError(errorMsg);
		}
	}
}
