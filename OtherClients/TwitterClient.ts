import { TwitterAuthValues } from "./TwitterAuthValue.ts";
import { TweetV2PostTweetResult, TwitterApi } from "npm:twitter-api-v2@1.15.0";
import { Utils } from "../core/Utils.ts";
import { WebApiClient } from "../core/WebApiClient.ts";

/**
 * Provides twitter functionality.
 */
export class TwitterClient extends WebApiClient {
	private readonly twitterClientBase: TwitterApi;

	/**
	 * Creates a new instance of the TwitterClient class.
	 * @param secrets The Twitter secrets and tokens.
	 */
	constructor(authValues: TwitterAuthValues) {
		super();

		this.twitterClientBase = new TwitterApi({
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
		const tweetResult: TweetV2PostTweetResult = await this.twitterClientBase.v2.tweet(message);

		if (tweetResult.errors) {
			tweetResult.errors.forEach((error) => {
				let errorMsg = `Error Title: ${error.title}`;
				errorMsg += `\nError Detail: ${error.detail}`;

				Utils.printAsGitHubError(errorMsg);
			});
		} else {
			Utils.printAsGitHubNotice(`${tweetResult.data.id}\n${tweetResult.data.text}`);
		}
	}
}
