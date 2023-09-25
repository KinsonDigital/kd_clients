export { LabelClient } from "./GitHubClients/LabelClient.ts";
export { IssueClient } from "./GitHubClients/IssueClient.ts";
export { GitClient } from "./GitHubClients/GitClient.ts";
export { MilestoneClient } from "./GitHubClients/MilestoneClient.ts";
export { OrgClient } from "./GitHubClients/OrgClient.ts";
export { ProjectClient } from "./GitHubClients/ProjectClient.ts";
export { PullRequestClient } from "./GitHubClients/PullRequestClient.ts";
export { ReleaseClient } from "./GitHubClients/ReleaseClient.ts";
export { RepoClient } from "./GitHubClients/RepoClient.ts";
export { TagClient } from "./GitHubClients/TagClient.ts";
export { UsersClient } from "./GitHubClients/UsersClient.ts";
export { WorkflowClient } from "./GitHubClients/WorkflowClient.ts";
export { XClient } from "./OtherClients/XClient.ts";
export { NuGetClient } from "./PackageClients/NuGetClient.ts";

/**
 * TODO:
 * 1. ✅Rename all interfaces by removing the beginning "I".  This is not a typescript convention.
 * 2. Need to remove org and repo names from all client methods and move them to the constructor.
 * 3. ✅Create a folder called 'GraphQl' with 2 sub folders called 'Queries' and 'Mutations'.
 * 	  - ✅Update all the import paths to reflect this change.
 * 4. ✅Rename the folder 'NuGetClients' to 'PackageClients'.
 * 5. ✅Rename the folder 'TwitterClients' to 'OtherClients'
 * 6. Rename the 'TwitterClient' class to 'XClient'
 * 7. Rename the 'TwitterAuthValue' class to 'XAuthValue'
 * 
 
Migrated Over List:
	✅GitClient.ts
	✅IssueClient.ts
	✅LabelClient.ts
	✅MilestoneClient.ts
	✅NuGetClient.ts
	✅OrgClient.ts
	✅ProjectClient.ts
	✅PullRequestClient.ts
	✅ReleaseClient.ts
	✅RepoClient.ts
	✅TagClient.ts
	✅TwitterClient.ts
	✅UsersClient.ts
	✅WorkflowClient.ts
	✅GitHubClient.ts
	✅WebApiClient.ts
	✅GithubResponse.ts
*/

