import { ReleaseClient } from "@kd/clients";
import getEnvVar from "../core/GetEnvVar.ts";
import { validateOrgExists, validateRepoExists, validateUserExists } from "../core/Validators.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const ownerName = getEnvVar("OWNER_NAME", scriptFileName);
const repoName = getEnvVar("REPO_NAME", scriptFileName);
let tagName = getEnvVar("TAG_NAME", scriptFileName).toLowerCase();
const token = getEnvVar("GITHUB_TOKEN", scriptFileName);
tagName = tagName.startsWith("v") ? tagName : `v${tagName}`;

await validateUserExists(scriptFileName);
await validateOrgExists(scriptFileName);
await validateRepoExists(scriptFileName);

const releaseClient = new ReleaseClient(ownerName, repoName, token);

if (await releaseClient.releaseExists(tagName)) {
	const errorMsg = `A GitHub release for tag '${tagName}' already exists.`;
	console.error(errorMsg);
	Deno.exit(1);
}
