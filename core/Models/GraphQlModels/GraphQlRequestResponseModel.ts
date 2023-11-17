import { ErrorModel } from "./ErrorModel.ts";

/**
 * Represents a request response from a GraphQL request.
 */
export type GraphQlRequestResponseModel = {
	/**
	 * The data returned from the request.
	 */
	// deno-lint-ignore no-explicit-any
	data: any;

	/**
	 * The message returned from the request.
	 */
	message?: string;

	/**
	 * The errors returned from the request.
	 */
	errors?: ErrorModel[];
};
