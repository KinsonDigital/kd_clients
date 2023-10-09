/**
 * Provides utility functions.
 */
export class Utils {
	private static readonly prodVersionRegex = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
	private static readonly prevVersionRegex = /^v[0-9]+\.[0-9]+\.[0-9]+-preview\.[0-9]+$/;

	/**
	 * Checks if the value is null, undefined, or empty.
	 * @param value The value to check.
	 * @returns True if the value is null, undefined, or empty, otherwise false.
	 */
	public static isNothing<T>(
		value: undefined | null | string | number | boolean | T[] | (() => T) | object,
	): value is undefined | null | "" | number | T[] | (() => T) {
		if (value === undefined || value === null) {
			return true;
		}

		if (typeof value === "string") {
			return value === "";
		}

		if (Array.isArray(value)) {
			return value.length === 0;
		}

		return false;
	}

	/**
	 * Checks if the given {@link version} is a valid production version.
	 * @param version The version to check.
	 * @returns True if the version is a valid production version, otherwise false.
	 */
	public static validProdVersion(version: string): boolean {
		return this.prodVersionRegex.test(version.trim().toLowerCase());
	}

	/**
	 * Checks if the given {@link version} is not valid production version.
	 * @param version The version to check.
	 * @returns True if the version is not a valid production version, otherwise false.
	 */
	public static isNotValidProdVersion(version: string): boolean {
		return !Utils.validProdVersion(version);
	}

	/**
	 * Checks if the given {@link version} is a valid preview version.
	 * @param version The version to check.
	 * @returns True if the version is a valid preview version, otherwise false.
	 */
	public static validPreviewVersion(version: string): boolean {
		return this.prevVersionRegex.test(version.trim().toLowerCase());
	}

	/**
	 * Checks if the given {@link version} is not a valid preview version.
	 * @param version The version to check.
	 * @returns True if the version is not a valid preview version, otherwise false.
	 */
	public static isNotValidPreviewVersion(version: string): boolean {
		return !Utils.validPreviewVersion(version);
	}
}
