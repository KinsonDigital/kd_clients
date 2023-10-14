import { WebApiClient } from "../core/WebApiClient.ts";
import { Guard } from "../core/Guard.ts";
import { Utils } from "../core/Utils.ts";
import { NuGetHttpStatusCodes } from "../core/Enums.ts";

/**
 * References:
 * NuGet API Overview: https://learn.microsoft.com/en-us/nuget/api/overview#resources-and-schema
 * NuGet Get Package Content: https://learn.microsoft.com/en-us/nuget/api/package-base-address-resource
 * NuGet errors and warnings: https://learn.microsoft.com/en-us/nuget/reference/errors-and-warnings
 */

/**
 * Provides a client for interacting with nuget.org.
 */
export class NuGetClient extends WebApiClient {
	/**
	 * Initializes a new instance of the {@link NuGetClient} class.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor() {
		super();
		this.baseUrl = "https://api.nuget.org";
	}

	/**
	 * Checks if a package that matches the given {@link packageName} exists in the NuGet registry.
	 * @param packageName The name of the NuGet package.
	 * @returns True if the package exists, otherwise false.
	 */
	public async packageExists(packageName: string): Promise<boolean> {
		Guard.isNothing(packageName, "packageExists", "packageName");

		packageName = packageName.trim().toLowerCase();
		const url = this.buildUrl(packageName);

		const response: Response = await this.requestGET(url);
		const statusCode: NuGetHttpStatusCodes = response.status as NuGetHttpStatusCodes;

		if (this.statusCodeValid(statusCode)) {
			return statusCode === NuGetHttpStatusCodes.SuccessWithResponseBody;
		} else {
			let errorMsg = `There was an issue checking for the '${packageName}' NuGet package.`;
			errorMsg += `\n${this.getErrorMsg(response)}}`;

			Utils.printError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Gets all of the versions for a NuGet package that matches the given {@link packageName}.
	 * @param packageName The name of the NuGet package.
	 * @returns The versions of the given NuGet package.
	 */
	public async getPackageVersions(packageName: string): Promise<string[]> {
		Guard.isNothing(packageName, "getPackageVersions", "packageName");

		packageName = packageName.trim().toLowerCase();
		const url = this.buildUrl(packageName);

		const response: Response = await this.requestGET(url);
		const statusCode: NuGetHttpStatusCodes = response.status as NuGetHttpStatusCodes;

		if (this.statusCodeValid(statusCode)) {
			const data = await this.getResponseData<{ versions: string[] }>(response);

			return data.versions;
		} else {
			let errorMsg = `There was an issue getting the versions for the '${packageName}' NuGet package.`;
			errorMsg += `\n${this.getErrorMsg(response)}}`;

			Utils.printError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Checks if a package that matches the given {@link packageName} exits in the NuGet registry with the given {@link version}.
	 * @param packageName The name of the NuGet package.
	 * @param version The version of the NuGet package.
	 * @returns True if the package exists with the given version, otherwise false.
	 */
	public async packageWithVersionExists(packageName: string, version: string): Promise<boolean> {
		Guard.isNothing(packageName, "getPackageVersions", "packageName");

		packageName = packageName.trim().toLowerCase();
		version = version.trim().toLowerCase();

		const url = this.buildUrl(packageName);

		const response: Response = await this.requestGET(url);
		const statusCode: NuGetHttpStatusCodes = response.status as NuGetHttpStatusCodes;

		if (this.statusCodeValid(statusCode)) {
			if (statusCode === NuGetHttpStatusCodes.SuccessWithResponseBody) {
				const versions = <string[]> (await this.getResponseData<{ versions: string[] }>(response))
					.versions.map((v: string) => v.toLowerCase());

				return versions.includes(version);
			} else {
				// Here would be a not found status code
				return false;
			}
		} else {
			let errorMsg = `There was an issue getting information about the '${packageName}' NuGet package.`;
			errorMsg += `\n${this.getErrorMsg(response)}}`;

			Utils.printError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Checks if the given status code is valid.
	 * @param statusCode The status code to check.
	 * @returns True if the status code is valid, otherwise false.
	 */
	private statusCodeValid(statusCode: NuGetHttpStatusCodes): boolean {
		switch (statusCode) {
			case NuGetHttpStatusCodes.SuccessIncompleteOrCompletedAsync:
			case NuGetHttpStatusCodes.SuccessWithNoResponseBody:
			case NuGetHttpStatusCodes.PermanentRedirect:
			case NuGetHttpStatusCodes.TemporaryRedirect:
			case NuGetHttpStatusCodes.ParamsNotValid:
			case NuGetHttpStatusCodes.CredentialsInvalid:
			case NuGetHttpStatusCodes.ActionNotAllowedWithCreds:
			case NuGetHttpStatusCodes.ResourceConflicts:
			case NuGetHttpStatusCodes.InternalServerError:
			case NuGetHttpStatusCodes.TemporarilyUnavailable:
				return false;
			default:
				break;
		}

		return true;
	}

	/**
	 * Gets the error message from the given response.
	 * @param response The response to get the data from.
	 * @returns The error status code and text.
	 */
	private getErrorMsg(response: Response): string {
		return `Error: ${response.status} - ${response.statusText}`;
	}

	/**
	 * Builds the URL for the NuGet package info.
	 * @param packageName The name of the NuGet package.
	 * @returns The URL for the NuGet package info.
	 */
	private buildUrl(packageName: string): string {
		return `${this.baseUrl}/v3-flatcontainer/${packageName}/index.json`;
	}
}
