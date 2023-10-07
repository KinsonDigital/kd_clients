import { existsSync } from "https://deno.land/std@0.194.0/fs/exists.ts";

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
	 * @param recursive True to search recursively, otherwise false.
	 */
	public static getFiles(dirPath: string, recursive = false): string[] {
		let files: string[] = [];

		if (dirPath === undefined || dirPath === null || dirPath === "") {
			const errorMsg = "The dirPath parameter cannot be null or empty.";
			Deno.exit(1);
		}

		dirPath = dirPath === "." || dirPath === "/" ? "." : dirPath;

		for (const dirEntry of Deno.readDirSync(dirPath)) {
			const entry = dirPath + "/" + dirEntry.name;

			if (recursive && dirEntry.isDirectory) {
				files = [...files, ...(Directory.getFiles(entry, recursive))];
			} else if (dirEntry.isFile) {
				files.push(entry);
			}
		}

		return files;
	}
}
