import { TagClient } from "@gh-clients/TagClient.ts";
import { Utils } from "@core/Utils.ts";
import getEnvVar from "@cicd/core/GetEnvVar.ts";
import { validateOrgExists, validateRepoExists } from "@cicd/core/Validators.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const ownerName = getEnvVar("OWNER_NAME", scriptFileName);
const repoName = getEnvVar("REPO_NAME", scriptFileName);
let version = getEnvVar("VERSION", scriptFileName).toLowerCase();
const token = getEnvVar("GITHUB_TOKEN", scriptFileName);
version = version.startsWith("v") ? version : `v${version}`;

await validateOrgExists(scriptFileName);
await validateRepoExists(scriptFileName);

const tagClient: TagClient = new TagClient(ownerName, repoName, token);

if (await tagClient.exists(version)) {
	const errorMsg = `The tag '${version}' already exists.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}
