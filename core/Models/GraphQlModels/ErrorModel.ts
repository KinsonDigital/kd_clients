import { LocationModel } from "./LocationModel.ts";

/**
 * Represents an error.
 */
export type ErrorModel = {
	/**
	 * The error message.
	 */
	message: string;

	/**
	 * The type of error.
	 */
	type?: string;

	/**
	 * The path to the file where the error occurs.
	 */
	path?: string[];

	/**
	 * The locations of the error.
	 */
	locations: LocationModel[];
};
