import { Utils } from "../../../core/Utils.ts";
import { File } from "../core/File.ts";
import getEnvVar from "../core/GetEnvVar.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const versionType = getEnvVar("VERSION_TYPE", scriptFileName);
let version = getEnvVar("VERSION", scriptFileName);

version = version.startsWith("v") ? version : `v${version}`;

let releaseNotesDirName = "";

if (Utils.isPreviewRelease(versionType)) {
	if (Utils.isNotValidPreviewVersion(version)) {
		Utils.printError(`The preview version '${version}' is not valid.`);
		Deno.exit(300);
	}

	releaseNotesDirName = "PreviewReleases";
} else if (Utils.isProductionRelease(versionType)) {
	if (Utils.isNotValidProdVersion(version)) {
		Utils.printError(`The production version '${version}' is not valid.`);
		Deno.exit(400);
	}

	releaseNotesDirName = "ProductionReleases";
}

const releaseNotesDirPath = `./ReleaseNotes/${releaseNotesDirName}/Release-Notes-${version}.md`;

if (File.DoesNotExist(releaseNotesDirPath)) {
	Utils.printError(`The release notes '${releaseNotesDirPath}' does not exist.`);
	Deno.exit(500);
}
