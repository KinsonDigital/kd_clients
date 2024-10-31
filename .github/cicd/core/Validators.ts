import { Utils } from "../../../deps.ts";
import { MilestoneClient, OrgClient, RepoClient } from "../../../GitHubClients/mod.ts";
import getEnvVar from "./GetEnvVar.ts";

/**
 * Validates that a GitHub organization exists.
 * @param scriptFileName The name of the script file.
 * @remarks The owner and token are retrieved from the environment variables 'OWNER_NAME' and 'GITHUB_TOKEN'.
 */
const validateOrgExists = async (scriptFileName?: string): Promise<void> => {
	const ownerName = getEnvVar("OWNER_NAME", scriptFileName);
	const token = getEnvVar("GITHUB_TOKEN", scriptFileName);

	const orgClient = new OrgClient(ownerName, token);

	// If the org does not exist
	if (!(await orgClient.exists())) {
		const errorMsg = `The organization '${ownerName}' does not exist.` +
			(Utils.isNothing(scriptFileName) ? "" : `\n\t${scriptFileName}`);

		Utils.printError(errorMsg);
		Deno.exit(1);
	}
};

/**
 * Validates that a GitHub organization exists.
 * @param scriptFileName The name of the script file.
 * @remarks The owner and token are retrieved from the environment variables 'OWNER_NAME' 'REPO_NAME', and 'GITHUB_TOKEN'.
 */
const validateRepoExists = async (scriptFileName?: string): Promise<void> => {
	const ownerName = getEnvVar("OWNER_NAME", scriptFileName);
	const repoName = getEnvVar("REPO_NAME", scriptFileName);
	const token = getEnvVar("GITHUB_TOKEN", scriptFileName);

	const repoClient = new RepoClient(ownerName, repoName, token);

	if (!(await repoClient.exists())) {
		const errorMsg = `The repository '${repoName}' does not exist.` +
			(Utils.isNothing(scriptFileName) ? "" : `\n\t${scriptFileName}`);

		Utils.printError(errorMsg);
		Deno.exit(1);
	}
};

/**
 * Validates that a GitHub milestone exists.
 * @param milestoneTitle The title of the milestone.
 * @param scriptFileName The name of the script file.
 * @remarks The owner and token are retrieved from the environment variables 'OWNER_NAME' 'REPO_NAME', and 'GITHUB_TOKEN'.
 */
const validateMilestoneExists = async (milestoneTitle: string, scriptFileName?: string): Promise<void> => {
	const ownerName = getEnvVar("OWNER_NAME", scriptFileName);
	const repoName = getEnvVar("REPO_NAME", scriptFileName);
	const token = getEnvVar("GITHUB_TOKEN", scriptFileName);

	const milestoneClient = new MilestoneClient(ownerName, repoName, token);

	if (!(await milestoneClient.exists(milestoneTitle))) {
		const errorMsg = `The milestone '${milestoneTitle}' for repo '${repoName}' does not exist.` +
			(Utils.isNothing(scriptFileName) ? "" : `\n\t${scriptFileName}`);

		Utils.printError(errorMsg);
		Deno.exit(1);
	}
};

export { validateMilestoneExists, validateOrgExists, validateRepoExists };
