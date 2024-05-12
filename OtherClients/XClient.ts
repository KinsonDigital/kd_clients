import { Guard } from "../core/Guard.ts";
import { XAuthValues } from "./XAuthValues.ts";
import { oauth1a } from "../deps.ts";
import { WebApiClient } from "../core/WebApiClient.ts";
import { XError } from "../deps.ts";

/**
 * Provides twitter functionality.
 */
export class XClient extends WebApiClient {
	private readonly authValues: XAuthValues;

	/**
	 * Creates a new instance of the {@link XClient} class.
	 * @param secrets The X secrets and tokens.
	 */
	constructor(authValues: XAuthValues) {
		Guard.isNothing(authValues, "ctor", "authValues");
		super();
		this.authValues = authValues;
	}

	/**
	 * Sends a tweet with the given {@link message}.
	 * @description Manage setting up and tweeting the given status
	 */
	public async tweet(message: string): Promise<void> {
		const fetcher = await oauth1a({
			consumerKey: this.authValues.consumer_api_key,
			secretConsumerKey: this.authValues.consumer_api_secret,
			accessToken: this.authValues.access_token_key,
			secretAccessToken: this.authValues.access_token_secret,
		});

		const response = await fetcher("/2/tweets", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text: message,
			}),
		});

		if (response.status != 200 && response.status != 201) {
			throw new XError(`Failed to send tweet.\n${response.status} - ${response.statusText}`);
		}
	}
}
