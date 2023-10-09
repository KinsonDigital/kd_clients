import { WorkflowRunModel } from "models/WorkflowRunModel.ts";

/**
 * Represents a list of workflow runs.
 */
export type WorkflowRunsModel = {
	/**
	 * Gets or sets the number of workflows runs.
	 */
	total_count: number;

	/**
	 * Gets or sets the list of workflow runs.
	 */
	workflow_runs: WorkflowRunModel[];
};
