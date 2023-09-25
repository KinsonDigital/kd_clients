import { createOrgProjectsQuery } from "../core/GraphQl/Queries/GetOrgProjectsQueries.ts";
import { ProjectModel } from "../core/Models/ProjectModel.ts";
import { GraphQlClient } from "../core/GraphQlClient.ts";
import { Guard } from "../core/Guard.ts";
import { Utils } from "../core/Utils.ts";
import { createLinkItemToProjectMutation } from "../core/GraphQl/Mutations/AddToProjectMutation.ts";
import { createGetIssueProjectsQuery } from "../core/GraphQl/Queries/GetIssueProjectsQuery.ts";
import { createGetPullRequestProjectsQuery } from "../core/GraphQl/Queries/GetPullRequestProjectsQuery.ts";

/**
 * Gets or saves data related to GitHub organization projects.
 * @remarks This client requires authentication for all requests.
 */
export class ProjectClient extends GraphQlClient {
	/**
	 * Initializes a new instance of the {@link ProjectClient} class.
	 * @param ownerName The name of the owner of the repository to use.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token.
	 */
	constructor(ownerName: string, repoName: string, token: string) {
		const funcName = "ProjectClient.ctor";
		Guard.isNullOrEmptyOrUndefined(ownerName, funcName, "ownerName");
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");

		super(token);
	}

	/**
	 * Gets a list of the GitHub organization projects.
	 * @returns The list of projects.
	 */
	public async getOrgProjects(): Promise<ProjectModel[]> {
		const query = createOrgProjectsQuery(this.ownerName);
		const responseData = await this.executeQuery(query);

		return <ProjectModel[]> responseData.data.organization.projectsV2.nodes;
	}

	/**
	 * Returns a value indicating whether or not the project exists with the given {@link projectName}.
	 * @param projectName The name of the project.
	 * @returns True if the project exists, otherwise false.
	 */
	public async exists(projectName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(projectName, "projectExists");

		projectName = projectName.trim();
		const projects = await this.getOrgProjects();

		return projects.some((project) => project.title === projectName);
	}

	/**
	 * Adds an issue or pull request with the given {@link contentId} to a project with the given {@link projectName}.
	 * @param contentId The node id of an issue or pull request.
	 * @param projectName The name of the project.
	 * @throws Throws an error if the project does not exist.
	 */
	public async addToProject(contentId: string, projectName: string): Promise<void> {
		const funcName = "addToProject";
		Guard.isNullOrEmptyOrUndefined(contentId, funcName);
		Guard.isNullOrEmptyOrUndefined(projectName, funcName);

		contentId = contentId.trim();
		projectName = projectName.trim();

		const projects = await this.getOrgProjects();

		const project: ProjectModel | undefined = projects.find((project) => project.title.trim() === projectName);

		if (project === undefined) {
			Utils.printAsGitHubError(`The project '${projectName}' does not exist.`);
			Deno.exit(1);
		}

		const query = createLinkItemToProjectMutation(contentId, project.id);
		await this.executeQuery(query);
	}

	/**
	 * Gets a list of the organizational projects for an issue that has the given {@link issueNumber},
	 * in a repository with a name that matches the given {@link repoName}.
	 * @param issueNumber The issue number.
	 * @returns The list of organizational projects that the issue is assigned to.
	 */
	public async getIssueProjects(issueNumber: number): Promise<ProjectModel[]> {
		const funcName = "getIssueProjects";
		Guard.isLessThanOne(issueNumber, funcName);

		const query = createGetIssueProjectsQuery(this.ownerName, this.repoName, issueNumber);
		const responseData = await this.executeQuery(query);

		return <ProjectModel[]> responseData.data.repository.issue.projectsV2.nodes;
	}

	/**
	 * Gets a list of the organizational projects for a pull request that has the given {@link prNumber},
	 * in a repository with a name that matches the given {@link repoName}.
	 * @param prNumber The issue number.
	 * @returns The list of organizational projects that the issue is assigned to.
	 */
	public async getPullRequestProjects(prNumber: number): Promise<ProjectModel[]> {
		const funcName = "getPullRequestProjects";
		Guard.isLessThanOne(prNumber, funcName);

		const query = createGetPullRequestProjectsQuery(this.ownerName, this.repoName, prNumber);
		const responseData = await this.executeQuery(query);

		return <ProjectModel[]> responseData.data.repository.pullRequest.projectsV2.nodes;
	}
}
