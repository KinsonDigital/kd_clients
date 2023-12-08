import { Utils } from "../../../core/Utils.ts";
import { walkSync } from "../../../deps.ts";

/**
 * Pulls the version from a json file.
 */
export class VersionPuller {
	/**
	 * Pulls the version from a json file.
	 * @returns The version number.
	 */
	public getVersion(fileName: string, baseDirPath?: string): string {
		const searchDirPath = Utils.isNothing(baseDirPath) ? Deno.cwd() : baseDirPath;

		const entries = walkSync(searchDirPath, {
			includeFiles: true,
			includeDirs: false,
			exts: [".json"],
			match: [/.*deno.json.*/gm],
			skip: [/.*node_modules.*/gm]
		});
		
		const items = [...entries].map((entry) => entry.path);

		const denoJsonFilePath = items.length > 0 ? items[0] : undefined;

		if (denoJsonFilePath === undefined) {
			const errorMsg = `The file '${fileName}' could not be found when pulling the version number.`;
			Utils.printError(errorMsg);
			Deno.exit(1);
		}

		const fileData = Deno.readTextFileSync(denoJsonFilePath);
		const jsonObj = JSON.parse(fileData);

		// If the object contains a property with the name version
		if (jsonObj.version === undefined) {
			const errorMsg = `The file '${fileName}' does not contain a version property.`;
			Utils.printError(errorMsg);
			Deno.exit(1);
		}

		return jsonObj.version.trim();
	}
}
