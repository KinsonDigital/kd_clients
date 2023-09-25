import { Guard } from "../core/Guard.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { UserModel } from "../core/Models/UserModel.ts";

/**
 * Provides a client for interacting with users.
 */
export class UsersClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link UsersClient} class.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(token?: string) {
		super(token);
	}

	/**
	 * Gets a user that matches the given {@link userName}.
	 * @param userName The name of the user.
	 * @returns The user.
	 */
	public async getUser(userName: string): Promise<UserModel> {
		Guard.isNullOrEmptyOrUndefined(userName, "getIssue", "repoName");

		// REST API Docs: https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-a-user
		const url = `${this.baseUrl}/users/${userName}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			Utils.printAsGitHubError(`The user '${userName}' does not exist.`);
			Deno.exit(1);
		}

		return <UserModel> await this.getResponseData(response);
	}

	/**
	 * Returns a value indicating whether or not a users exists with the given {@link userName}.
	 * @param userName The user's name.
	 * @returns True if the user exists, otherwise false.
	 */
	public async userExists(userName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(userName, "userExists", "issueNumber");

		// REST API Docs: https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-a-user
		const url = `${this.baseUrl}/users/${userName}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			return false;
		} else {
			return true;
		}
	}
}
