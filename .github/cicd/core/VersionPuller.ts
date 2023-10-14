import { Utils } from "../../../core/Utils.ts";
import { Directory } from "../core/Directory.ts";

/**
 * Pulls the version from a json file.
 */
export class VersionPuller {
	/**
	 * Pulls the version from a json file.
	 * @returns The version number.
	 */
	public getVersion(fileName: string): string {
		const denoJsonFilePath = Directory
			.getFiles(".", true)
			.find(f => f.endsWith(fileName));

		if (denoJsonFilePath === undefined) {
			const errorMsg = `The file '${fileName}' could not be found when pulling the version number.`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const fileData = Deno.readTextFileSync(denoJsonFilePath);
		const jsonObj = JSON.parse(fileData);

		// If the object contains a property with the name version
		if (jsonObj.version === undefined) {
			const errorMsg = `The file '${fileName}' does not contain a version property.`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		return jsonObj.version;
	}
}
