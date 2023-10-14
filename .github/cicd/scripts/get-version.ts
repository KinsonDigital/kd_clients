import { Utils } from "../../../core/Utils.ts";
import { VersionPuller } from "../core/VersionPuller.ts";

const versionPuller: VersionPuller = new VersionPuller();

const version = versionPuller.getVersion("./deno.json");

const outputFilePath = Deno.env.get("GITHUB_OUTPUT") ?? "";

if (outputFilePath === "") {
	const errorMsg = `The environment variable 'GITHUB_OUTPUT' does not exist or is not set.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}

Deno.writeTextFileSync(outputFilePath, `version=${version}`);

Utils.printAsGitHubNotice(`The output 'version' has been set to '${version}'.`)
