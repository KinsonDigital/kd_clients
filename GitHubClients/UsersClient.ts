import { Guard } from "../core/Guard.ts";
import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { UserModel } from "../deps.ts";
import { UsersError } from "../deps.ts";

/**
 * Provides a client for interacting with users.
 */
export class UsersClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link UsersClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		super(ownerName, repoName, token);
	}

	/**
	 * Gets a user that matches the given {@link userName}.
	 * @param userName The name of the user.
	 * @returns The user.
	 * @throws The {@link UsersError} if there was an issue getting the user.
	 */
	public async getUser(userName: string): Promise<UserModel> {
		Guard.isNothing(userName, "getIssue", "repoName");

		// REST API Docs: https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-a-user
		const url = `${this.baseUrl}/users/${userName}`;

		const response: Response = await this.requestGET(url);

		if (response.status != GitHubHttpStatusCodes.OK) {
			// If there is an error
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				throw new UsersError(`The user '${userName}' does not exist.`, response.status);
			} else {
				throw new UsersError(`There was an issue getting the user '${userName}'.`, response.status);
			}
		}

		return <UserModel> await this.getResponseData(response);
	}

	/**
	 * Returns a value indicating whether or not a users exists with the given {@link userName}.
	 * @param userName The user's name.
	 * @returns True if the user exists, otherwise false.
	 * @throws The {@link UsersError} if there was an issue checking if the user exists.
	 */
	public async userExists(userName: string): Promise<boolean> {
		Guard.isNothing(userName, "userExists", "issueNumber");

		// REST API Docs: https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-a-user
		const url = `${this.baseUrl}/users/${userName}`;

		const response: Response = await this.requestGET(url);

		if (response.status != GitHubHttpStatusCodes.OK) {
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				return false;
			} else {
				throw new UsersError(`There was an issue checking if the user '${userName}' exists.`, response.status);
			}
		}

		return true;
	}
}
