import { XAuthValues } from "./XAuthValue.ts";
import { TweetV2PostTweetResult, TwitterApi } from "../deps.ts";
import { WebApiClient } from "../core/WebApiClient.ts";
import { XError } from "../GitHubClients/Errors/XError.ts";

/**
 * Provides twitter functionality.
 */
export class XClient extends WebApiClient {
	private readonly xClientBase: TwitterApi;

	/**
	 * Creates a new instance of the {@link XClient} class.
	 * @param secrets The X secrets and tokens.
	 */
	constructor(authValues: XAuthValues) {
		super();

		this.xClientBase = new TwitterApi({
			appKey: authValues.consumer_api_key,
			appSecret: authValues.consumer_api_secret,
			accessToken: authValues.access_token_key,
			accessSecret: authValues.access_token_secret,
		});
	}

	/**
	 * Sends a tweet with the given {@link message}.
	 * @description Manage setting up and tweeting the given status
	 */
	public async tweet(message: string): Promise<void> {
		const tweetResult: TweetV2PostTweetResult = await this.xClientBase.v2.tweet(message);

		if (tweetResult.errors) {
			tweetResult.errors.forEach((error) => {
				let errorMsg = `Error Title: ${error.title}`;
				errorMsg += `\nError Detail: ${error.detail}`;

				throw new XError(errorMsg);
			});
		}
	}
}
