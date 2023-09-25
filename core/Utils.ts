// import { GitHubHttpStatusCodes, GitHubLogType } from "./Enums.ts";
import { Guard } from "./Guard.ts";
import { IssueModel } from "./Models/IssueModel.ts";
import { PullRequestModel } from "./Models/PullRequestModel.ts";
// import { ProjectModel } from "./Models/ProjectModel.ts";
// import { LabelModel } from "./Models/LabelModel.ts";
// import { UserModel } from "./Models/UserModel.ts";

/**
 * Provides utility functions.
 */
 export class Utils {
	private static readonly prodVersionRegex = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
	private static readonly prevVersionRegex = /^v[0-9]+\.[0-9]+\.[0-9]+-preview\.[0-9]+$/;
	private static readonly featureBranchRegex = /^feature\/[1-9][0-9]*-(?!-)[a-z-]+/gm;

	// /**
	//  * Checks if the value is numeric.
	//  * @param value The value to check.
	//  * @returns True if the value is numeric, otherwise false.
	//  */
	// public static isNumeric(value: string): boolean {
	// 	const parsedValue = parseFloat(value);

	// 	return !isNaN(parsedValue) && isFinite(parsedValue) && value === parsedValue.toString();
	// }

	// /**
	//  * Prints the lines of text in a GitHub group.
	//  * @param lineOrLines The lines of text to print.
	//  */
	// public static printInGroup(title: string, lineOrLines: string | string[]): void {
	// 	console.log(`::group::${title}`);

	// 	if (typeof lineOrLines === "string") {
	// 		console.log(lineOrLines);
	// 	} else {
	// 		lineOrLines.forEach((line) => {
	// 			console.log(line);
	// 		});
	// 	}

	// 	console.log("::endgroup::");
	// }

	/**
	 * Checks if the value is null, undefined, or empty.
	 * @param value The value to check.
	 * @returns True if the value is null, undefined, or empty, otherwise false.
	 */
	public static isNullOrEmptyOrUndefined<T>(
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

	// /**
	//  * Filters the given list of issues or pull requests to only return issues.
	//  * @param issuesOrPrs The issues or pull requests to filter.
	//  * @returns The issues from the given list of issues or pull requests.
	//  */
	// public static filterIssues(issuesOrPrs: (IssueModel | PullRequestModel)[]): IssueModel[] {
	// 	return <IssueModel[]> issuesOrPrs.filter((item) => this.isIssue(item));
	// }

	// /**
	//  * Filters the given list of issues or pull requests to only return pull requests.
	//  * @param issuesOrPrs The issues or pull requests to filter.
	//  * @returns The pull requests from the given list of issues or pull requests.
	//  */
	// public static filterPullRequests(issuesOrPrs: (IssueModel | PullRequestModel)[]): PullRequestModel[] {
	// 	return <PullRequestModel[]> issuesOrPrs.filter((item) => this.isPr(item));
	// }

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
	 * Prints the given {@link message} as a GitHub notice.
	 * @param message The message to print.
	 */
	public static printAsGitHubNotice(message: string): void {
		Utils.printEmptyLine();
		console.log(`::notice::${message}`);
		Utils.printEmptyLine();
	}

	// /**
	//  * Prints the given {@link messages} as GitHub notices.
	//  * @param messages The messages to print.
	//  */
	// public static printAsGitHubNotices(messages: string[]): void {
	// 	messages.forEach((message) => {
	// 		Utils.printAsGitHubNotice(message);
	// 	});
	// }

	/**
	 * Prints the given {@link message} as a GitHub error.
	 * @param message The message to print.
	 */
	public static printAsGitHubError(message: string): void {
		Utils.printEmptyLine();
		console.log(`::error::${message}`);
		Utils.printEmptyLine();
	}

	// /**
	//  * Prints the given {@link messages} as GitHub errors.
	//  * @param messages The error messages.
	//  */
	// public static printAsGitHubErrors(messages: string[]): void {
	// 	messages.forEach((message) => {
	// 		Utils.printAsGitHubError(message);
	// 	});
	// }

	// /**
	//  * Prints the given {@link message} as a GitHub warning.
	//  * @param message The message to print.
	//  */
	// public static printAsGitHubWarning(message: string): void {
	// 	Utils.printEmptyLine();
	// 	console.log(`::warning::${message}`);
	// 	Utils.printEmptyLine();
	// }

	// /**
	//  * Prints the given list of problems as errors.
	//  * @param problems The list of problems to print.
	//  * @param successMsg The message to print if there are no problems.
	//  * @param failureMsg The message to print if there are problems.
	//  * @returns A promise that resolves if there are no problems, otherwise rejects with the list of problems.
	//  */
	// public static printProblemList(problems: string[], successMsg: string, failureMsg: string): void {
	// 	const errorList: string[] = [];

	// 	// Display all of the issues that have been found as errors
	// 	for (let i = 0; i < problems.length; i++) {
	// 		const errorFound = problems[i];

	// 		errorList.push(`${i + 1}. ${errorFound}`);
	// 	}

	// 	if (errorList.length > 0) {
	// 		Utils.printAsGitHubError(failureMsg);
	// 		console.log(`::group::${errorList.length} problems found.`);

	// 		errorList.forEach((error) => {
	// 			this.printAsGitHubError(error);
	// 		});

	// 		console.log("::endgroup::");
	// 	} else {
	// 		Utils.printAsGitHubNotice(successMsg);
	// 	}
	// }

	// /**
	//  * Adds sequential numbers to the given list of {@link items}.
	//  * @param items The items to number.
	//  * @returns The numbered items.
	//  */
	// public static numberItems(items: string[]): string[] {
	// 	const result: string[] = [];

	// 	for (let i = 0; i < items.length - 1; i++) {
	// 		result.push(`${Utils.toOrdinal(i + 1)} ${items[i]}}`);
	// 	}

	// 	return result;
	// }

	// /**
	//  * Prints the given list of {@link items} as a numbered list with each item prefixed with the given {@link prefix},
	//  * and logged to the GitHub console based on the given {@link logType}.
	//  * @param prefix The prefix to use for each item.
	//  * @param items The items to print.
	//  * @param logType The type of logging to use.
	//  */
	// public static printAsNumberedList(prefix: string, items: string[], logType: GitHubLogType = GitHubLogType.normal): void {
	// 	const argInfos: string[] = [];

	// 	for (let i = 0; i < items.length - 1; i++) {
	// 		argInfos.push(`${Utils.toOrdinal(i + 1)}${prefix}${items[i]}`);
	// 	}

	// 	argInfos.forEach((info) => {
	// 		switch (logType) {
	// 			case GitHubLogType.normal:
	// 				console.log(info);
	// 				break;
	// 			case GitHubLogType.notice:
	// 				Utils.printAsGitHubNotice(info);
	// 				break;
	// 			case GitHubLogType.warning:
	// 				Utils.printAsGitHubWarning(info);
	// 				break;
	// 			case GitHubLogType.error:
	// 				Utils.printAsGitHubError(info);
	// 				break;
	// 			default:
	// 				console.log(info);
	// 				break;
	// 		}
	// 	});
	// }

	// /**
	//  * Checks if the response contains status codes other than in the 200 range.
	//  * If it does, it will print the error message and exit the process.
	//  * @param response The response from a request.
	//  */
	// public static throwIfErrors(response: Response): void {
	// 	if (response.status < GitHubHttpStatusCodes.OK) {
	// 		const errorMsg = `There was a problem with the request. Error: ${response.status}(${response.statusText}).`;

	// 		Utils.printAsGitHubError(errorMsg);
	// 		Deno.exit(1);
	// 	}
	// }

	// /**
	//  * Checks if the given {@link version} is a valid production version.
	//  * @param version The version to check.
	//  * @returns True if the version is a valid production version, otherwise false.
	//  */
	// public static validProdVersion(version: string): boolean {
	// 	return this.prodVersionRegex.test(version.trim().toLowerCase());
	// }

	// /**
	//  * Checks if the given {@link version} is not valid production version.
	//  * @param version The version to check.
	//  * @returns True if the version is not a valid production version, otherwise false.
	//  */
	// public static isNotValidProdVersion(version: string): boolean {
	// 	return !Utils.validProdVersion(version);
	// }

	// /**
	//  * Checks if the given {@link version} is a valid preview version.
	//  * @param version The version to check.
	//  * @returns True if the version is a valid preview version, otherwise false.
	//  */
	// public static validPreviewVersion(version: string): boolean {
	// 	return this.prevVersionRegex.test(version.trim().toLowerCase());
	// }

	// /**
	//  * Checks if the given {@link version} is not a valid preview version.
	//  * @param version The version to check.
	//  * @returns True if the version is not a valid preview version, otherwise false.
	//  */
	// public static isNotValidPreviewVersion(version: string): boolean {
	// 	return !Utils.validPreviewVersion(version);
	// }

	/**
	 * Returns a number that is clamped between the given {@link min} and {@link max} values.
	 * @param value The value to clamp.
	 * @param min The minimum value.
	 * @param max The maximum value.
	 * @returns A value that is clamped between the given {@link min} and {@link max} values.
	 */
	public static clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}

	// /**
	//  * Builds a URL to an issue that matches the given {@link issueNumber} in a repository that with a
	//  * name that matches the given {@link repoName} and is owned by the given {@link repoOwner}.
	//  * @param repoOwner The owner of the repository.
	//  * @param repoName The name of the repository.
	//  * @param issueNumber The issue number.
	//  * @returns The URL to the issue.
	//  */
	// public static buildIssueUrl(repoOwner: string, repoName: string, issueNumber: number): string {
	// 	const funcName = "buildIssueUrl";
	// 	Guard.isNullOrEmptyOrUndefined(repoOwner, funcName, "repoOwner");
	// 	Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
	// 	Guard.isLessThanOne(issueNumber, funcName, "issueNumber");

	// 	return `https://github.com/${repoOwner}/${repoName}/issues/${issueNumber}`;
	// }

	/**
	 * Builds a URL to a pull request that matches the given {@link prNumber} in a repository with a
	 * name that matches the given {@link repoName} and is owned by the given {@link repoOwner}.
	 * @param repoOwner The owner of the repository.
	 * @param repoName The name of the repository.
	 * @param prNumber The pull request number.
	 * @returns The URL to the issue.
	 */
	public static buildPullRequestUrl(repoOwner: string, repoName: string, prNumber: number): string {
		const funcName = "buildPullRequestUrl";
		Guard.isNullOrEmptyOrUndefined(repoOwner, funcName, "repoOwner");
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isLessThanOne(prNumber, funcName, "prNumber");

		return `https://github.com/${repoOwner}/${repoName}/pull/${prNumber}`;
	}

	/**
	 * Builds a URL to the labels page of a repository with a name that matches the given {@link repoName}
	 * and is owned by the given {@link repoOwner}.
	 * @param repoOwner The owner of the repository.
	 * @param repoName The name of the repository.
	 * @returns The URL to the repository labels page.
	 */
	public static buildLabelsUrl(repoOwner: string, repoName: string): string {
		const funcName = "buildLabelsUrl";
		Guard.isNullOrEmptyOrUndefined(repoOwner, funcName, "repoOwner");
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");

		return `https://github.com/${repoOwner}/${repoName}/labels`;
	}

	// /**
	//  * Returns a value indicating whether or not the assignees of the given {@link issue} and {@link pr} match.
	//  * @param issue The issue to compare with the pull request.
	//  * @param pr The pull request to compare with the issue.
	//  * @returns True if the assignees of the given {@link issue} and {@link pr} match, otherwise false.
	//  */
	// public static assigneesMatch(issueAssignees: UserModel[], prAssignees: UserModel[]): boolean {
	// 	if (issueAssignees.length === 0 && prAssignees.length === 0) {
	// 		return true;
	// 	}

	// 	if (issueAssignees.length != prAssignees.length) {
	// 		return false;
	// 	}

	// 	for (let i = 0; i < issueAssignees.length; i++) {
	// 		if (issueAssignees[i].login != prAssignees[i].login) {
	// 			return false;
	// 		}
	// 	}

	// 	return true;
	// }

	// /**
	//  * Returns a value indicating whether or not the labels of the given {@link issue} and {@link pr} match.
	//  * @param issue The issue to to compare with the pull request.
	//  * @param pr The pull request to compare with the issue.
	//  * @returns True if the labels of the issue and pull request match, otherwise false.
	//  */
	// public static labelsMatch(issueLabels: LabelModel[], prLabels: LabelModel[]): boolean {
	// 	if (issueLabels.length === 0 && prLabels.length === 0) {
	// 		return true;
	// 	}

	// 	if (issueLabels.length != prLabels.length) {
	// 		return false;
	// 	}

	// 	for (let i = 0; i < issueLabels.length; i++) {
	// 		if (issueLabels[i].name != prLabels[i].name) {
	// 			return false;
	// 		}
	// 	}

	// 	return true;
	// }

	// /**
	//  * Returns a value indicating whether or not the organizational projects of the given
	//  * {@link issueProjects} and {@link prProjects} match.
	//  * @param issueProjects The issue projects to to compare with the pull request projects.
	//  * @param prProjects The pull request projects to compare with the issue projects.
	//  * @returns True if the labels of the issue and pull request match, otherwise false.
	//  */
	// public static orgProjectsMatch(issueProjects: ProjectModel[], prProjects: ProjectModel[]): boolean {
	// 	if (issueProjects.length === 0 && prProjects.length === 0) {
	// 		return true;
	// 	}

	// 	if (issueProjects.length != prProjects.length) {
	// 		return false;
	// 	}

	// 	for (let i = 0; i < issueProjects.length; i++) {
	// 		if (issueProjects[i].number != prProjects[i].number) {
	// 			return false;
	// 		}
	// 	}

	// 	return true;
	// }

	// /**
	//  * Converts the given {@link number} to its ordinal representation.
	//  * @param number The number to convert.
	//  * @returns The ordinal representation of the given {@link number}.
	//  */
	// public static toOrdinal(number: number): string {
	// 	const suffixes = ["th", "st", "nd", "rd"];
	// 	const value = Math.abs(number) % 100;
	// 	const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];

	// 	return `${number}${suffix}`;
	// }

	/**
	 * Prints an empty line to the console.
	 */
	public static printEmptyLine(): void {
		console.log();
	}

	// /**
	//  * Returns a value indicating whether or not the given {@link branchName} is a feature branch.
	//  * @param branchName The name of the branch to check.
	//  * @returns True if the given {@link branchName} is a feature branch, otherwise false.
	//  */
	// public static isFeatureBranch(branchName: string): boolean {
	// 	return branchName.match(this.featureBranchRegex) != null;
	// }

	// /**
	//  * Returns a value indicating whether or not the given {@link branchName} is a feature branch.
	//  * @param branchName The name of the branch to check.
	//  * @returns True if the given {@link branchName} is not a feature branch, otherwise false.
	//  */
	// public static isNotFeatureBranch(branchName: string): boolean {
	// 	return !this.isFeatureBranch(branchName);
	// }

	// /**
	//  * Converts the given {@link value} to a string with its first letter converted to upper case.
	//  * @param value The value to convert.
	//  * @returns The given {@link value} with its first letter converted to upper case.
	//  */
	// public static firstLetterToUpper(value: string): string {
	// 	if (Utils.isNullOrEmptyOrUndefined(value)) {
	// 		return value;
	// 	}

	// 	const allButFirstLetter = value.slice(1);
	// 	const firstLetter = value.slice(0, 1).toUpperCase();

	// 	return `${firstLetter}${allButFirstLetter}`;
	// }

	// /**
	//  * Normalizes any endings in the given {@link value}.
	//  * @param value The value with line endings to normalize.
	//  * @returns The given {@link value} with normalized line endings.
	//  */
	// public static normalizeLineEndings(value: string): string {
	// 	return value.indexOf("\\r\\n") === -1 ? value.replaceAll("\\r\\n", "\\n") : value;
	// }

	// /**
	//  * Trims all of the given {@link values}.
	//  * @param values The values to trim.
	//  * @returns The given {@link values} with all values trimmed.
	//  */
	// public static trimAll(values: string[]): string[] {
	// 	const trimmedValues: string[] = [];

	// 	values.forEach((value) => {
	// 		trimmedValues.push(value.trim());
	// 	});

	// 	return trimmedValues;
	// }

	// /**
	//  * Removes any white space from the start of the given {@link value}.
	//  * @param value The value to remove the starting white space from.
	//  * @returns The given {@link value} with the starting white space removed.
	//  */
	// public static trimAllStartingWhiteSpace(value: string): string {
	// 	if (Utils.isNullOrEmptyOrUndefined(value)) {
	// 		return value;
	// 	}

	// 	Utils.trimAllStartingValue(value, "");
	// 	Utils.trimAllStartingValue(value, "\t");

	// 	return value;
	// }

	/**
	 * Trims the given {@link valueToRemove} from the start of the given {@link valueToTrim}
	 * until the {@link valueToRemove} does not exit anymore.
	 * @param valueToTrim The value to trim the starting value from.
	 * @param valueToRemove The starting value to trim.
	 * @returns The given {@link valueToTrim} with the starting value trimmed.
	 */
	public static trimAllStartingValue(valueToTrim: string, valueToRemove: string): string {
		if (Utils.isNullOrEmptyOrUndefined(valueToTrim)) {
			return valueToTrim;
		}

		if (Utils.isNullOrEmptyOrUndefined(valueToRemove)) {
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
		if (Utils.isNullOrEmptyOrUndefined(valueToTrim)) {
			return valueToTrim;
		}

		if (Utils.isNullOrEmptyOrUndefined(valueToRemove)) {
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

	// /**
	//  * Splits the given {@link value} by the given {@link separator}.
	//  * @param value The value to split.
	//  * @param separator The separator to split the value by.
	//  * @returns The values split by the given separator.
	//  * @remarks Only the first character will be used by the given {@link separator}.
	//  */
	// public static splitBy(value: string, separator: string): string[] {
	// 	if (Utils.isNullOrEmptyOrUndefined(value)) {
	// 		return [];
	// 	}

	// 	if (Utils.isNullOrEmptyOrUndefined(separator)) {
	// 		return [value];
	// 	}

	// 	// Only use the first character for a separator
	// 	separator = separator.length === 1 ? separator : separator[0];

	// 	return value.indexOf(separator) === -1 ? [value] : value.split(separator)
	// 		.map((v) => v.trim())
	// 		.filter((i) => !Utils.isNullOrEmptyOrUndefined(i));
	// }

	// /**
	//  * Splits the given {@link value} by comma.
	//  * @param value The value to split by comma.
	//  * @returns The values split by comma.
	//  */
	// public static splitByComma(value: string): string[] {
	// 	if (Utils.isNullOrEmptyOrUndefined(value)) {
	// 		return [];
	// 	}

	// 	return this.splitBy(value, ",");
	// }
}
