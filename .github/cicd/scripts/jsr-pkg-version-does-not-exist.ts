import getJsrPkgMetaData from "../core/get-jsr-pkg-meta-data.ts";
import getEnvVar from "../core/GetEnvVar.ts";

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const scope = getEnvVar("SCOPE", scriptFileName).toUpperCase();
const pkgName = getEnvVar("PACKAGE_NAME", scriptFileName);
let version = getEnvVar("VERSION", scriptFileName);

version = version.startsWith("v") ? version.substring(1) : version;

const versions = await getJsrPkgMetaData(scope, pkgName);

if (versions.includes(version)) {
	console.log(`::error::%cThe version '${version}' already exists for the package '@${scope}/${pkgName}'.`, "color: indianred");
	Deno.exit(1);
}
