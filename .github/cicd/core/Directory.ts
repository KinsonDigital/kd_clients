import { Utils } from "../../../core/Utils.ts";
import { existsSync } from "../../../deps.ts";

/**
 * Provides directory functionality.
 */
export class Directory {
	/**
	 * Checks if the given directory path exists.
	 * @param dirPath The path of the directory to check.
	 * @returns True if the directory exists, otherwise false.
	 */
	public static Exists(dirPath: string): boolean {
		return existsSync(dirPath, { isDirectory: true, isFile: false });
	}

	/**
	 * Checks if the given directory path does not exist.
	 * @param dirPath The path of the directory to check.
	 * @returns True if the directory does not exist, otherwise false.
	 */
	public static DoesNotExist(dirPath: string): boolean {
		return !this.Exists(dirPath);
	}

	/**
	 * Gets a list of files in the given {@link dirPath}.  This will search recursively
	 * if {@link recursive} is true.
	 * @param dirPath The path of the directory start searching.
	 * @param extension The file extension to search for.
	 * @param recursive True to search recursively, otherwise false.
	 * @returns {string[]} A list of files in the given {@link dirPath}.
	 */
	public static getFiles(dirPath: string, extension: string, recursive = false): string[] {
		let files: string[] = [];

		extension = extension.trim();
		extension = Utils.isNothing(extension) ? "*.*" : extension;

		if (extension !== "*.*") {
			extension = extension.startsWith("*.") ? extension.substring(1) : extension;

			if (!extension.startsWith(".") || extension.length === 1) {
				const errorMsg = `The extension '${extension}' is not supported.\n` +
					`Must be a value of '*.*' or '*.<extension>'.`;
				console.log(errorMsg);
				throw new Error(errorMsg);
			}
		}

		if (dirPath === undefined || dirPath === null || dirPath === "") {
			const errorMsg = "The dirPath parameter cannot be null or empty.";
			console.log(errorMsg);
			Deno.exit(1);
		}

		dirPath = dirPath === "." || dirPath === "./" ? Deno.cwd() : dirPath;

		for (const dirEntry of Deno.readDirSync(dirPath)) {
			const entry = dirPath === "/" ? dirPath + dirEntry.name : dirPath + "/" + dirEntry.name;

			if (recursive && dirEntry.isDirectory) {
				files = [...files, ...(Directory.getFiles(entry, extension, recursive))];
			} else if (dirEntry.isFile) {
				if (extension === "*.*") {
					files.push(entry);
				} else {
					if (entry.endsWith(extension)) {
						files.push(entry);
					}
				}
			}
		}

		return files;
	}
}
