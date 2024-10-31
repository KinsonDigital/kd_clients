import type { JsrMetaModel } from "./models/jsr-meta-model.ts";

/**
 * 
 * @param scope 
 * @param pkgName 
 */
export default async function getJsrPkgMetaData(scope: string, pkgName: string): Promise<string[]> {
	scope = scope.toLowerCase();
	pkgName = pkgName.toLowerCase();

	const url = `https://jsr.io/@${scope}/${pkgName}/meta.json`;

	const response = await fetch(url);

	const metaData = await response.json() as JsrMetaModel;

	if (response.status !== 200) {
		const errorMsg = `An error occurred while fetching the meta data for the package '@${scope}/${pkgName}'.` +
			`\n${response.status} - ${response.statusText}`
		
		console.log(`%c${errorMsg}`, "color: indianred");
		Deno.exit();
	}

	const versions = Object.keys(metaData.versions);

	return versions;
}
