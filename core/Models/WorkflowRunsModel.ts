import type { WorkflowRunModel } from "./mod.ts";

/**
 * Represents a list of workflow runs.
 */
export interface WorkflowRunsModel {
	/**
	 * Gets or sets the number of workflows runs.
	 */
	total_count: number;

	/**
	 * Gets or sets the list of workflow runs.
	 */
	workflow_runs: WorkflowRunModel[];
}
