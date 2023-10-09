import { RepoClient, TagClient, UsersClient } from "github/mod.ts";
import { Utils } from "core/Utils.ts";

if (Deno.args.length !== 5) {
	let errorMsg = `The required arguments is 4 but only received ${Deno.args.length}.`;
	errorMsg += `\nPlease provide the following arguments: version, owner name, repo name, and token.`;
	Utils.printAsGitHubError(errorMsg);
	Deno.exit(1);
}

const ownerName = Deno.args[0].trim();
const repoName = Deno.args[1].trim();
const versionType = Deno.args[2].trim().toLowerCase();

let version = Deno.args[3].trim().toLowerCase();
version = version.startsWith("v") ? version : `v${version}`;

const token = Deno.args[4].trim();

const userCLient: UsersClient = new UsersClient(token);

if (!await userCLient.userExists(ownerName)) {
	const errorMsg = `The user '${ownerName}' does not exist.`;
	Utils.printAsGitHubError(errorMsg);
	Deno.exit(1);
}

const repoClient: RepoClient = new RepoClient(ownerName, repoName, token);

if (!await repoClient.exists()) {
	const errorMsg = `The repository '${repoName}' does not exist.`;
	Utils.printAsGitHubError(errorMsg);
	Utils.printAsGitHubError(errorMsg);
	Deno.exit(1);
}

const tagClient: TagClient = new TagClient(ownerName, repoName, token);

if (await tagClient.tagExists(version)) {
	const errorMsg = `The tag '${version}' already exists.`;
	Utils.printAsGitHubError(errorMsg);
	Deno.exit(1);
}

if (versionType != "preview" && versionType != "production") {
	const errorMsg = `The version type '${versionType}' is not valid. Valid values are 'preview' or 'production' version type.`;
	Utils.printAsGitHubError(errorMsg);
	Deno.exit(1);
}

// Verify that the version is a valid preview or production version
if (versionType === "preview") {
	if (Utils.isNotValidPreviewVersion(version)) {
		const errorMsg = `The version '${version}' is not valid. Please provide a valid preview version.`;
		Utils.printAsGitHubError(errorMsg);
		Deno.exit(1);
	}
} else if (versionType === "production") {
	if (Utils.isNotValidProdVersion(version)) {
		const errorMsg = `The version '${version}' is not valid. Please provide a valid production version.`;
		Utils.printAsGitHubError(errorMsg);
		Deno.exit(1);
	}
}
