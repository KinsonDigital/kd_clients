import { Utils } from "../../../core/Utils.ts";
import getEnvVar from "../core/GetEnvVar.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const versionType = getEnvVar("VERSION_TYPE", scriptFileName).toLowerCase();
let version = getEnvVar("VERSION", scriptFileName).toLowerCase();
version = version.startsWith("v") ? version : `v${version}`;

if (versionType !== "preview" && versionType !== "production") {
	const errorMsg = `The version type '${versionType}' is not valid. Valid values are 'preview' or 'production' version type.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}

// Verify that the version is a valid preview or production version
if (versionType === "preview" && Utils.isNotValidPreviewVersion(version)) {
	const errorMsg = `The version '${version}' is not valid. Please provide a valid preview version.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
} else if (versionType === "production" && Utils.isNotValidProdVersion(version)) {
	const errorMsg = `The version '${version}' is not valid. Please provide a valid production version.`;
	Utils.printError(errorMsg);
	Deno.exit(1);
}
