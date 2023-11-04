import { Guard } from "./Guard.ts";

/**
 * Provides a base class for HTTP clients.
 */
export abstract class WebApiClient {
	protected readonly headers: Headers = new Headers();
	protected baseUrl = "";

	/**
	 * Gets the data from an HTTP response.
	 * @param response The HTTP response to get the data from.
	 * @returns The data from the response.
	 */
	protected async getResponseData<T>(response: Response): Promise<T> {
		const responseText: string = await response.text();

		return this.headers.has("Accept") && this.headers.get("Accept") === "application/vnd.github.v3.raw"
			? responseText
			: await JSON.parse(responseText);
	}

	/**
	 * Gets a resource by performing an HTTP request using the GET method.
	 * @param url The URL of the request.
	 * @returns The response from the request.
	 */
	public async requestGET(url: string): Promise<Response> {
		Guard.isNothing(url, "fetchGET", "url");

		return await fetch(url, {
			method: "GET",
			headers: this.headers,
		});
	}

	/**
	 * Creates a resource by performing an HTTP request using the POST method.
	 * @param url The URL of the request.
	 * @param body The body of the request.
	 * @returns The response from the request.
	 */
	public async requestPOST(url: string, body: string | object): Promise<Response> {
		const funcName = "fetchPOST";
		Guard.isNothing(url, funcName, "url");
		Guard.isNothing(body, funcName, "body");

		const requestBody = typeof body === "string" ? body : JSON.stringify(body);

		return await fetch(url, {
			method: "POST",
			headers: this.headers,
			body: requestBody,
		});
	}

	/**
	 * Updates a resource by performing an HTTP request using the PATCH method.
	 * @param url The URL of the request.
	 * @param body The body of the request.
	 * @returns The response from the request.
	 */
	public async requestPATCH(url: string, body: string): Promise<Response> {
		const funcName = "fetchPATCH";
		Guard.isNothing(url, funcName, "url");
		Guard.isNothing(body, funcName, "body");

		return await fetch(url, {
			method: "PATCH",
			headers: this.headers,
			body: body,
		});
	}

	/**
	 * Deletes a resource by performing an HTTP request using the DELETE method.
	 * @param url The URL of the request.
	 * @returns The response from the request.
	 */
	public async requestDELETE(url: string): Promise<Response> {
		Guard.isNothing(url, "fetchDELETE", "url");

		return await fetch(url, {
			method: "DELETE",
			headers: this.headers,
		});
	}

	/**
	 * Modifies a resource by performing an HTTP request using the PUT method.
	 * @param url The URL of the request.
	 * @param body The body of the request.
	 * @returns The response from the request.
	 */
	public async requestPUT(url: string, body: string): Promise<Response> {
		const funcName = "fetchPUT";
		Guard.isNothing(url, funcName, "url");
		Guard.isNothing(body, funcName, "body");

		return await fetch(url, {
			method: "PUT",
			headers: this.headers,
			body: body,
		});
	}

	/**
	 * Sets an HTTP header with a name that matches the given {@link name}
	 * to the given {@link value}.
	 * @param name The name of the header to set.
	 * @param value The value of the header to set.
	 */
	protected setHeader(name: string, value: string): void {
		if (this.headers.has(name)) {
			this.headers.set(name, value);
		} else {
			this.headers.append(name, value);
		}
	}

	/**
	 * Builds an error message from the given error message and response.
	 * @param errorMsg The error message to use.
	 * @param response The response to get the data from.
	 * @returns The error status code and text.
	 */
	protected buildErrorMsg(errorMessage: string, response: Response): string {
		return `${errorMessage}\nError: ${response.status}(${response.statusText})`;
	}
}
