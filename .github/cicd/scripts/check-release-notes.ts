import { Utils } from "../../../core/Utils.ts";
import { File } from "../core/File.ts";

if (Deno.args.length != 2) {
	let errorMsg = `The required number of arguments is 2 but received ${Deno.args.length}.`;
	errorMsg += `\nPlease provide the following arguments: version type, version.`;
	Utils.printAsGitHubError(errorMsg);
	Deno.exit(100);
}

const versionType = Deno.args[0].trim().toLowerCase();
let version = Deno.args[1].trim().toLowerCase();

if (Utils.invalidReleaseType(versionType)) {
	Utils.printAsGitHubError(`The version type must be either 'preview' or 'release' but received '${versionType}'.`);
	Deno.exit(200);
}

version = version.startsWith("v") ? version : `v${version}`;

let releaseNotesDirName = "";

if (Utils.isPreviewRelease(versionType)) {
	if (Utils.isNotValidPreviewVersion(version)) {
		Utils.printAsGitHubError(`The preview version '${version}' is not valid.`);
		Deno.exit(300);
	}

	releaseNotesDirName = "PreviewReleases";
} else if (Utils.isProductionRelease(versionType)) {
	if (Utils.isNotValidProdVersion(version)) {
		Utils.printAsGitHubError(`The production version '${version}' is not valid.`);
		Deno.exit(400);
	}

	releaseNotesDirName = "ProductionReleases";
}

const releaseNotesDirPath = `./ReleaseNotes/${releaseNotesDirName}/Release-Notes-${version}.md`;

if (File.DoesNotExist(releaseNotesDirPath)) {
	Utils.printAsGitHubError(`The release notes '${releaseNotesDirPath}' does not exist.`);
	Deno.exit(500);
}
