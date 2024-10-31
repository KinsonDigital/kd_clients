import type { JsrMetaModel } from "@cicd/core/models/jsr-meta-model.ts";

/**
 * Gets the meta data for a package with the given {@link scope} and {@link pkgName}.
 * @param scope The scope of the package.
 * @param pkgName The name of the package.
 */
export default async function getJsrPkgMetaData(scope: string, pkgName: string): Promise<string[]> {
	scope = scope.toLowerCase();
	pkgName = pkgName.toLowerCase();

	const url = `https://jsr.io/@${scope}/${pkgName}/meta.json`;

	const response = await fetch(url);

	const metaData = await response.json() as JsrMetaModel;

	if (response.status !== 200) {
		const errorMsg = `An error occurred while fetching the meta data for the package '@${scope}/${pkgName}'.` +
			`\n${response.status} - ${response.statusText}`;

		console.log(`%c${errorMsg}`, "color: indianred");
		Deno.exit();
	}

	const versions = Object.keys(metaData.versions);

	return versions;
}
