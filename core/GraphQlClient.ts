import { RequestResponseModel } from "./Models/GraphQlModels/RequestResponseModel.ts";
import { Utils } from "./Utils.ts";
import { Guard } from "./Guard.ts";
import { BadCredentialsError } from "../GitHubClients/Errors/BadCredentials.ts";

/**
 * Provides a base class for HTTP clients.
 */
export abstract class GraphQlClient {
	private baseUrl = "https://api.github.com/graphql";
	private _repoName = "";
	private _ownerName = "";
	protected readonly headers: Headers = new Headers();

	/**
	 * Initializes a new instance of the {@link GraphQlClient} class.
	 * @param ownerName The name of the repository owner.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token: string) {
		this.ownerName = Utils.isNothing(ownerName) ? "" : ownerName.trim();
		this.repoName = Utils.isNothing(repoName) ? "" : repoName.trim();

		this.headers.append("Authorization", `Bearer ${token}`);
	}

	/**
	 * Gets the name of the owner of the repository.
	 */
	public get ownerName(): string {
		return this._ownerName;
	}

	/**
	 * Sets the name of the owner of the repository.
	 */
	public set ownerName(v: string) {
		Guard.isNothing("ownerName", v, "v");
		this._ownerName = v.trim();
	}

	/**
	 * Gets the name of the repository.
	 */
	public get repoName(): string {
		return this._repoName;
	}

	/**
	 * Sets the name of the repository.
	 */
	public set repoName(v: string) {
		Guard.isNothing("repoName", v, "v");
		this._repoName = v.trim();
	}

	/**
	 * Returns a value indicating whether or not a token was provided.
	 * @returns True if a token was provided; otherwise, false.
	 */
	protected containsToken(): boolean {
		return this.headers.has("Authorization");
	}

	/**
	 * Gets the response data from a request.
	 * @param response The response from a request.
	 * @returns The response data.
	 * @remarks This method will throw an error if the response contains errors.
	 */
	protected async getResponseData(response: Response): Promise<RequestResponseModel> {
		const responseText = await response.text();
		const responseData = await JSON.parse(responseText);

		return responseData;
	}

	/**
	 * Fetch a resource from the network. It returns a Promise that resolves to the
	 * {@link Response} to that request, whether it is successful or not.
	 * @param query The GraphQL query to use for the request.
	 * @returns The response from the request.
	 */
	protected async executeQuery(query: string): Promise<RequestResponseModel> {
		const body: string = JSON.stringify({ query });

		const response = await fetch(this.baseUrl, {
			method: "POST",
			body: body,
			headers: this.headers,
		});

		const result = await this.getResponseData(response);

		if (!Utils.isNothing(result.message) && result.message === "Bad credentials") {
			throw new BadCredentialsError("The GraphQL query could not be executed because the credentials are invalid.");
		}

		return result;
	}
}
