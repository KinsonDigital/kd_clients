import { Guard } from "./Guard.ts";

/**
 * Provides a base class for HTTP clients.
 */
export abstract class WebApiClient {
	private readonly headers: Headers = new Headers();
	protected baseUrl = "";

	/**
	 * Gets the data from an HTTP response.
	 * @param response The HTTP response to get the data from.
	 * @returns The data from the response.
	 */
	protected async getResponseData<T>(response: Response): Promise<T> {
		const responseText: string = await response.text();

		const acceptHeaderValue = this.getHeader("Accept") ?? "";

		return acceptHeaderValue.length > 0 && acceptHeaderValue.includes("json")
			? await JSON.parse(responseText)
			: responseText;
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
	public async requestPOST(url: string, body: string | object | Uint8Array): Promise<Response> {
		const funcName = "fetchPOST";
		Guard.isNothing(url, funcName, "url");
		Guard.isNothing(body, funcName, "body");

		let requestBody: string | Uint8Array;

		if (body instanceof Uint8Array) {
			requestBody = body;
		} else {
			requestBody = typeof body === "string" ? body : JSON.stringify(body);
		}

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
	 * Gets the value of an HTTP header with a name that matches the given {@link name}.
	 * @param name The name of the header to get.
	 * @returns The value of the header.
	 */
	public getHeader(name: string): string | null {
		return this.headers.get(name);
	}

	/**
	 * Updates or adds an HTTP header with the given {@link name} and {@link value}.
	 * @param name The name of the header to set.
	 * @param value The value of the header to set.
	 */
	public updateOrAdd(name: string, value: string): void {
		if (this.headers.has(name)) {
			this.headers.set(name, value);
		} else {
			this.headers.append(name, value);
		}
	}

	/**
	 * Clears all of the HTTP headers.
	 */
	public clearHeaders(): void {
		for (const headerName of this.headers.keys()) {
			this.headers.delete(headerName);
		}
	}

	/**
	 * Returns a value indicating whether or not an HTTP header with the given {@link name} exists.
	 * @param name The name of the header to check.
	 * @returns True if the header exists, otherwise false.
	 */
	public containsHeader(name: string): boolean {
		return this.headers.has(name);
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
