import { Guard } from "./Guard.ts";
import { ReleaseType } from "./Enums.ts";
import { chalk } from "../deps.ts";
import { IssueModel } from "./Models/mod.ts";
import { PullRequestModel } from "./Models/mod.ts";
import { GraphQlRequestResponseModel } from "./Models/mod.ts";
import { ErrorModel } from "./Models/mod.ts";

/**
 * Provides utility functions.
 */
export class Utils {
	private static readonly prodVersionRegex = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
	private static readonly prevVersionRegex = /^v[0-9]+\.[0-9]+\.[0-9]+-preview\.[0-9]+$/;
	private static readonly featureBranchRegex = /^feature\/[1-9][0-9]*-(?!-)[a-z-]+/gm;

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
	 * Splits the given {@link value} by the given {@link separator}.
	 * @param value The value to split.
	 * @param separator The separator to split the value by.
	 * @returns The values split by the given separator.
	 * @remarks Only the first character will be used by the given {@link separator}.
	 */
	public static splitBy(value: string, separator: string): string[] {
		if (Utils.isNothing(value)) {
			return [];
		}

		if (Utils.isNothing(separator)) {
			return [value];
		}

		// Only use the first character for a separator
		separator = separator.length === 1 ? separator : separator[0];

		return value.indexOf(separator) === -1 ? [value] : value.split(separator)
			.map((v) => v.trim())
			.filter((i) => !Utils.isNothing(i));
	}

	/**
	 * Splits the given {@link value} by comma.
	 * @param value The value to split by comma.
	 * @returns The values split by comma.
	 */
	public static splitByComma(value: string): string[] {
		if (Utils.isNothing(value)) {
			return [];
		}

		return this.splitBy(value, ",");
	}

	/**
	 * Returns a number that is clamped between the given {@link min} and {@link max} values.
	 * @param value The value to clamp.
	 * @param min The minimum value.
	 * @param max The maximum value.
	 * @returns A value that is clamped between the given {@link min} and {@link max} values.
	 */
	public static clamp(value: number, min: number, max: number): number {
		if (value < min) {
			return min;
		} else if (value > max) {
			return max;
		} else {
			return value;
		}
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

	/**
	 * Prints an empty line to the console.
	 */
	public static printEmptyLine(): void {
		console.log();
	}

	/**
	 * Prints the given {@link message} as a error.
	 * @param message The message to print.
	 */
	public static printError(message: string): void {
		Utils.printEmptyLine();
		console.log(chalk.red(message));
		Utils.printEmptyLine();
	}

	/**
	 * Returns a value indicating whether or not the given {@link issueOrPr} is an issue.
	 * @param issueOrPr The issue or pull request to check.
	 * @returns True if the given issue or pull request is an issue, otherwise false.
	 */
	public static isIssue(issueOrPr: IssueModel | PullRequestModel): issueOrPr is IssueModel {
		return !("pull_request" in issueOrPr);
	}

	/**
	 * Returns a value indicating whether or not the given {@link issueOrPr} is a pull request.
	 * @param issueOrPr The issue or pull request to check.
	 * @returns True if the given issue or pull request is a pull request, otherwise false.
	 */
	public static isPr(issueOrPr: PullRequestModel | IssueModel): issueOrPr is PullRequestModel {
		return "pull_request" in issueOrPr;
	}

	/**
	 * Builds a URL to a pull request that matches the given {@link prNumber} in a repository with a
	 * name that matches the given {@link repoName} and is owned by the given {@link ownerName}.
	 * @param ownerName The owner of the repository.
	 * @param repoName The name of the repository.
	 * @param prNumber The pull request number.
	 * @returns The URL to the issue.
	 */
	public static buildPullRequestUrl(ownerName: string, repoName: string, prNumber: number): string {
		const funcName = "buildPullRequestUrl";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");
		Guard.isLessThanOne(prNumber, funcName, "prNumber");

		return `https://github.com/${ownerName}/${repoName}/pull/${prNumber}`;
	}

	/**
	 * Builds a URL to the labels page of a repository with a name that matches the given {@link repoName}
	 * and is owned by the given {@link ownerName}.
	 * @param ownerName The owner of the repository.
	 * @param repoName The name of the repository.
	 * @returns The URL to the repository labels page.
	 */
	public static buildLabelsUrl(ownerName: string, repoName: string): string {
		const funcName = "buildLabelsUrl";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		return `https://github.com/${ownerName}/${repoName}/labels`;
	}

	/**
	 * Trims the given {@link valueToRemove} from the start of the given {@link valueToTrim}
	 * until the {@link valueToRemove} does not exit anymore.
	 * @param valueToTrim The value to trim the starting value from.
	 * @param valueToRemove The starting value to trim.
	 * @returns The given {@link valueToTrim} with the starting value trimmed.
	 */
	public static trimAllStartingValue(valueToTrim: string, valueToRemove: string): string {
		if (Utils.isNothing(valueToTrim)) {
			return valueToTrim;
		}

		if (Utils.isNothing(valueToRemove)) {
			return valueToTrim;
		}

		while (valueToTrim.startsWith(valueToRemove)) {
			valueToTrim = valueToTrim.slice(1);
		}

		return valueToTrim;
	}

	/**
	 * Trims the given {@link valueToRemove} from the end of the given {@link valueToTrim}
	 * until the {@link valueToRemove} does not exit anymore.
	 * @param valueToTrim The value to trim the ending value from.
	 * @param valueToRemove The ending value to trim.
	 * @returns The given {@link valueToTrim} with the ending value trimmed.
	 */
	public static trimAllEndingValue(valueToTrim: string, valueToRemove: string): string {
		if (Utils.isNothing(valueToTrim)) {
			return valueToTrim;
		}

		if (Utils.isNothing(valueToRemove)) {
			return valueToTrim;
		}

		while (valueToTrim.endsWith(valueToRemove)) {
			valueToTrim = valueToTrim.slice(0, valueToTrim.length - 1);
		}

		return valueToTrim;
	}

	/**
	 * Normalizes the given {@link path} by replacing all back slashes with forward slashes,
	 * and trimming any and ending slashes.
	 * @param path The path to normalize.
	 * @returns The normalized path.
	 */
	public static normalizePath(path: string): string {
		path = path.replaceAll("\\", "/");
		path = path.replaceAll("//", "/");
		path = Utils.trimAllEndingValue(path, "/");

		return path;
	}

	/**
	 * Returns a value indicating whether or not the given {@link value} is a valid release type.
	 * @param value The value to check.
	 * @returns True if the value is a valid release type, otherwise false.
	 */
	public static invalidReleaseType(value: string): value is ReleaseType {
		return value != "preview" && value != "production";
	}

	/**
	 * Returns a value indicating whether or not the given {@link value} is a valid preview release type.
	 * @param value The value to check.
	 * @returns True if the value is a valid preview release type, otherwise false.
	 */
	public static isPreviewRelease(value: string): value is ReleaseType {
		return value === "preview";
	}

	/**
	 * Returns a value indicating whether or not the given {@link value} is a valid production release type.
	 * @param value The value to check.
	 * @returns True if the value is a valid production release type, otherwise false.
	 */
	public static isProductionRelease(value: string): value is ReleaseType {
		return value === "production";
	}

	/**
	 * Combines the given {@link mainMsg} and {@link requestResponse} error messages into one error message.
	 * @param mainMsg The main error message.
	 * @param requestResponse The request response that might contain more error messages.
	 * @returns The main and response error messages combined.
	 */
	public static toErrorMessage(mainMsg: string, requestResponse: GraphQlRequestResponseModel): string {
		const errorMessages: string[] = [];

		mainMsg = mainMsg.endsWith(":") ? mainMsg : `${mainMsg}:`;

		if (requestResponse.errors === undefined) {
			return mainMsg;
		}

		requestResponse.errors.forEach((error: ErrorModel) => {
			errorMessages.push(error.message);
		});

		let errorMsg = `The following errors occurred:`;
		errorMsg += `\n${errorMessages.join("\n")}`;

		return errorMsg;
	}
}
