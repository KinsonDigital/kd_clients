import type { LocationModel } from "./mod.ts";

/**
 * Represents an error.
 */
export interface ErrorModel {
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
}
