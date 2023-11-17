import { createOrgProjectsQuery } from "../core/GraphQl/Queries/GetOrgProjectsQueries.ts";
import { GraphQlClient } from "../core/GraphQlClient.ts";
import { Guard } from "../core/Guard.ts";
import { Utils } from "../core/Utils.ts";
import { createLinkItemToProjectMutation } from "../core/GraphQl/Mutations/AddToProjectMutation.ts";
import { createGetIssueProjectsQuery } from "../core/GraphQl/Queries/GetIssueProjectsQuery.ts";
import { createGetPullRequestProjectsQuery } from "../core/GraphQl/Queries/GetPullRequestProjectsQuery.ts";
import { ProjectError } from "./Errors/ProjectError.ts";
import { IssueClient, PullRequestClient } from "./mod.ts";
import { ProjectModel } from "../core/Models/mod.ts";
import { IssueModel } from "../core/Models/mod.ts";
import { PullRequestModel } from "../core/Models/mod.ts";

/**
 * Gets or saves data related to GitHub organization V2 projects.
 * @remarks This client requires authentication for all requests.
 */
export class ProjectClient extends GraphQlClient {
	private readonly issueClient: IssueClient;
	private readonly prClient: PullRequestClient;
	private readonly isInitialized: boolean = false;

	/**
	 * Initializes a new instance of the {@link ProjectClient} class.
	 * @param ownerName The name of the owner of the repository to use.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token.
	 */
	constructor(ownerName: string, repoName: string, token: string) {
		const funcName = "ProjectClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
		
		this.issueClient = new IssueClient(ownerName, repoName, token);
		this.prClient = new PullRequestClient(ownerName, repoName, token);

		this.isInitialized = true;
	}

	/**
	 * Sets the name of the owner of the repository.
	 */
	public set ownerName(v: string) {
		Guard.isNothing("ownerName", v, "v");
		super.ownerName = v.trim();

		if (!this.isInitialized) {
			return;
		}

		this.issueClient.ownerName;
		this.prClient.ownerName;
	}

	/**
	 * Sets the name of the repository.
	 */
	public set repoName(v: string) {
		Guard.isNothing("repoName", v, "v");
		super.repoName = v.trim();

		if (!this.isInitialized) {
			return;
		}

		this.issueClient.repoName = v;
		this.prClient.repoName = v;
	}

	/**
	 * Gets a list of the GitHub organization projects.
	 * @returns The list of projects.
	 * @throws The error {@link ProjectError} if an error occurs while getting the projects.
	 */
	public async getOrgProjects(): Promise<ProjectModel[]> {
		const query = createOrgProjectsQuery(super.ownerName);
		const responseData = await this.executeQuery(query);

		if (responseData.errors != undefined) {
			const mainMsg = "The following errors occurred while getting the organizational projects.";
			const errorMsg = Utils.toErrorMessage(mainMsg, responseData);

			throw new ProjectError(errorMsg);
		}

		return <ProjectModel[]> responseData.data.organization.projectsV2.nodes;
	}

	/**
	 * Returns a value indicating whether or not the project exists with the given {@link projectName}.
	 * @param projectName The name of the project.
	 * @returns True if the project exists, otherwise false.
	 */
	public async exists(projectName: string): Promise<boolean> {
		Guard.isNothing(projectName, "exists");

		projectName = projectName.trim();
		const projects = await this.getOrgProjects();

		return projects.some((project) => project.title === projectName);
	}

	/**
	 * Adds an issue with the given {@link issueNumber} to a project with the given {@link projectName}.
	 * @param issueNumber The issue number.
	 * @param projectName The name of the project.
	 * @throws The error {@link ProjectError} if an error occurs while adding the issue to the project.
	 */
	public async addIssueToProject(issueNumber: number, projectName: string): Promise<void> {
		Guard.isNothing(projectName, "addIssueToProject");

		let issue: IssueModel;

		try {
			issue = await this.issueClient.getIssue(issueNumber)
		} catch (error) {
			throw new ProjectError(error.message);
		}

		projectName = projectName.trim();

		const projects = await this.getOrgProjects();

		const project: ProjectModel | undefined = projects.find((project) => project.title.trim() === projectName);

		if (project === undefined) {
			throw new ProjectError(`The project '${projectName}' does not exist.`);
		}

		if (Utils.isNothing(issue.node_id)) {
			const errorMsg = `The issue '${issueNumber}' does not have a node ID.`;
			throw new ProjectError(errorMsg);
		}

		const query = createLinkItemToProjectMutation(issue.node_id, project.id);
		const response = await this.executeQuery(query);

		if (response.errors != undefined) {
			const mainMsg = `The following errors occurred while adding the issue '${issueNumber}' to the project '${projectName}'.`;
			const errorMsg = Utils.toErrorMessage(mainMsg, response);

			throw new ProjectError(errorMsg);
		}
	}

	/**
	 * Adds a pull request with the given {@link prNumber} to a project with the given {@link projectName}.
	 * @param prNumber The pull request number.
	 * @param projectName The name of the project.
	 * @throws The error {@link ProjectError} if an error occurs while adding the pull request to the project.
	 */
	public async addPullRequestToProject(prNumber: number, projectName: string): Promise<void> {
		Guard.isNothing(projectName, "addPullRequestToProject");

		let pr: PullRequestModel;

		try {
			pr = await this.prClient.getPullRequest(prNumber)
		} catch (error) {
			throw new ProjectError(error.message);
		}
		
		projectName = projectName.trim();

		const projects = await this.getOrgProjects();

		const project: ProjectModel | undefined = projects.find((project) => project.title.trim() === projectName);

		if (project === undefined) {
			throw new ProjectError(`The project '${projectName}' does not exist.`);
		}

		if (Utils.isNothing(pr.node_id)) {
			const errorMsg = `The pull request '${prNumber}' does not have a node ID.`;
			throw new ProjectError(errorMsg);
		}

		const query = createLinkItemToProjectMutation(pr.node_id, project.id);
		const response = await this.executeQuery(query);

		if (response.errors != undefined) {
			const mainMsg = `The following errors occurred while adding the pull request '${prNumber}' to the project '${projectName}'.`;
			const errorMsg = Utils.toErrorMessage(mainMsg, response);

			throw new ProjectError(errorMsg);
		}
	}
	
	/**
	 * Gets a list of the organizational projects for an issue that has the given {@link issueNumber},
	 * in a repository with a name that matches the {@link ProjectClient}.{@link repoName}.
	 * @param issueNumber The issue number.
	 * @returns The list of organizational projects that the issue is assigned to.
	 * @throws The error {@link ProjectError} if an error occurs while getting the issues projects.
	 */
	public async getIssueProjects(issueNumber: number): Promise<ProjectModel[]> {
		Guard.isLessThanOne(issueNumber, "getIssueProjects");

		const query = createGetIssueProjectsQuery(super.ownerName, super.repoName, issueNumber);
		const responseData = await this.executeQuery(query);

		if (responseData.errors != undefined) {
			const mainMsg = `The following errors occurred while getting the organizational projects for the issue '${issueNumber}'.`;
			const errorMsg = Utils.toErrorMessage(mainMsg, responseData);

			throw new ProjectError(errorMsg);
		}

		return <ProjectModel[]> responseData.data.repository.issue.projectsV2.nodes;
	}

	/**
	 * Gets a list of the organizational projects for a pull request that has the given {@link prNumber},
	 * in a repository with a name that matches the given {@link repoName}.
	 * @param prNumber The issue number.
	 * @returns The list of organizational projects that the issue is assigned to.
	 * @throws The error {@link ProjectError} if an error occurs while getting the pull requests projects.
	 */
	public async getPullRequestProjects(prNumber: number): Promise<ProjectModel[]> {
		Guard.isLessThanOne(prNumber, "getPullRequestProjects");

		const query = createGetPullRequestProjectsQuery(super.ownerName, super.repoName, prNumber);
		const responseData = await this.executeQuery(query);

		if (responseData.errors != undefined) {
			const mainMsg = `The following errors occurred while getting the organizational projects for the pull request '${prNumber}'.`;
			const errorMsg = Utils.toErrorMessage(mainMsg, responseData);

			throw new ProjectError(errorMsg);
		}

		return <ProjectModel[]> responseData.data.repository.pullRequest.projectsV2.nodes;
	}
}
