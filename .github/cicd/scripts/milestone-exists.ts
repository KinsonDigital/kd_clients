import getEnvVar from "@cicd/core/GetEnvVar.ts";
import { validateMilestoneExists, validateOrgExists, validateRepoExists } from "@cicd/core/Validators.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

let version = getEnvVar("VERSION", scriptFileName).toLowerCase();
version = version.startsWith("v") ? version : `v${version}`;

await validateOrgExists(scriptFileName);
await validateRepoExists(scriptFileName);
await validateMilestoneExists(version, scriptFileName);
