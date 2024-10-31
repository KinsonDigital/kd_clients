import { existsSync } from "@std/fs/exists";
import { Utils } from "../../../core/Utils.ts";
import getEnvVar from "../core/GetEnvVar.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const versionType = getEnvVar("VERSION_TYPE", scriptFileName).toLowerCase();
let version = getEnvVar("VERSION", scriptFileName);

version = version.startsWith("v") ? version : `v${version}`;

if (versionType !== "preview" && versionType !== "production") {
	const errorMsg = `The version type '${versionType}' is not valid. Valid values are 'preview' or 'production' version type.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}

const releaseNotesDirPath = `./ReleaseNotes/${versionType}-releases/Release-Notes-${version}.md`;

if (!existsSync(releaseNotesDirPath, { isFile: true })) {
	Utils.printError(`The release notes '${releaseNotesDirPath}' does not exist.`);
	Deno.exit(500);
}
