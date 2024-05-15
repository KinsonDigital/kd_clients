/**
 * Represents a location in a file in an error object.
 */
export interface LocationModel {
	/**
	 * The line number of the error.
	 */
	line: number;

	/**
	 * The column number of the error.
	 */
	column: number;
}
