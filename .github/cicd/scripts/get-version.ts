import { VersionPuller } from "../core/VersionPuller.ts";

const versionPuller: VersionPuller = new VersionPuller();

const version = versionPuller.getVersion("./deno.json");

const outputFilePath = Deno.env.get("GITHUB_OUTPUT") ?? "";

if (outputFilePath === "") {
	const errorMsg = `The environment variable 'GITHUB_OUTPUT' does not exist or is not set.`;
	console.log(`::error::${errorMsg}`);
	Deno.exit(1);
}

Deno.writeTextFileSync(outputFilePath, `version=${version}`);

console.log(`::notice::The output 'version' has been set to '${version}'.`);
