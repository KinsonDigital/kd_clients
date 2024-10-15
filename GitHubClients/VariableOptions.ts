import type { TransformType } from "../core/Types.ts";

/**
 * Represents various options when getting GitHub organization or repository variables.
 */
export interface VariableOptions {
	/**
	 * The type of trimming to perform on the variable values returned.
	 */
	transformType: TransformType | TransformType[];
}
