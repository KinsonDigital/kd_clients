/**
 * Represents the state of an issue to return in an HTTP request.
 */
export enum IssueOrPRState {
	/**
	 * All issues.
	 */
	any = "all",

	/**
	 * Issues that are open.
	 */
	open = "open",

	/**
	 * Issues that are closed.
	 */
	closed = "closed",
}

/**
 * Represents the state of an issue.
 */
export enum IssueState {
	/**
	 * Opened issue.
	 */
	open = "open",

	/**
	 * A closed issue.
	 */
	closed = "closed",
}

/**
 * Represents the merge state of a pull request.
 */
export enum MergeState {
	/**
	 * A pull request is merged or not merged.
	 */
	any = 0,

	/**
	 * A pull request is merged.
	 */
	merged = 1,

	/**
	 * A pull request is not merged.
	 */
	unmerged = 2,
}

/**
 * HTTP status codes.
 */
export enum GitHubHttpStatusCodes {
	/**
	 * The request succeeded. The result meaning of "success" depends on the HTTP method:
	 * - GET: The resource has been fetched and transmitted in the message body.
	 * - HEAD: The representation headers are included in the response without any message body.
	 * - PUT or POST: The resource describing the result of the action is transmitted in the message body.
	 * - TRACE: The message body contains the request message as received by the server.
	 */
	OK = 200,

	/**
	 * Success, and the resource was created.
	 */
	Created = 201,

	/**
	 * The server successfully processed the request and is not returning any content.
	 */
	NoContent = 204,

	/**
	 * The URL of the requested resource has been changed permanently. The new URL is given in the response.
	 */
	MovedPermanently = 301,

	/**
	 * A temporary redirect.
	 */
	TemporaryRedirect = 302,

	/**
	 * This is used for caching purposes. It tells the client that the response has not been modified, so the
	 * client can continue to use the same cached version of the response.
	 */
	NotModified = 304,

	/**
	 * The client does not have access rights to the content; that is, it is unauthorized, so the server is
	 * refusing to give the requested resource. Unlike 401 Unauthorized, the client's identity is known to
	 * the server.
	 */
	Forbidden = 403,

	/**
	 * The server cannot find the requested resource. In the browser, this means the URL is not recognized.
	 * In an API, this can also mean that the endpoint is valid but the resource itself does not exist.
	 * Servers may also send this response instead of 403 Forbidden to hide the existence of a resource from
	 * an unauthorized client. This response code is probably the most well known due to its frequent
	 * occurrence on the web.
	 */
	NotFound = 404,

	/**
	 * The client request has not been completed because it lacks valid authentication credentials for the requested resource.
	 */
	Unauthorized = 401,

	/**
	 * This response is sent when the requested content has been permanently deleted from server, with no
	 * forwarding address. Clients are expected to remove their caches and links to the resource. The HTTP
	 * specification intends this status code to be used for "limited-time, promotional services". APIs should
	 * not feel compelled to indicate resources that have been deleted with this status code.
	 */
	Gone = 410,

	/**
	 * The server understands the content type of the request entity, and the syntax of the request entity is correct,
	 * but it was unable to process the contained instructions
	 */
	UnprocessableContent = 422,

	/**
	 * The server has encountered a situation it does not know how to handle.
	 */
	InternalServerError = 500,

	/**
	 * The server is not ready to handle the request. Common causes are a server that is down for maintenance or
	 * that is overloaded. Note that together with this response, a user-friendly page explaining the problem
	 * should be sent. This response should be used for temporary conditions and the Retry-After HTTP header
	 * should, if possible, contain the estimated time before the recovery of the service. The webmaster must
	 * also take care about the caching-related headers that are sent along with this response, as these
	 * temporary condition responses should usually not be cached.
	 */
	ServiceUnavailable = 503,
}

/**
 * HTTP status codes for the NuGet API.
 */
export enum NuGetHttpStatusCodes {
	/**
	 * Success, and there is a response body.
	 */
	SuccessWithResponseBody = 200,

	/**
	 * Success, and the resource was created.
	 */
	SuccessResourceCreated = 201,

	/**
	 * Success, the request has been accepted but some work may still be incomplete and completed asynchronously.
	 */
	SuccessIncompleteOrCompletedAsync = 202,

	/**
	 * Success, but there is no response body.
	 */
	SuccessWithNoResponseBody = 204,

	/**
	 * A permanent redirect.
	 */
	PermanentRedirect = 301,

	/**
	 * A temporary redirect.
	 */
	TemporaryRedirect = 302,

	/**
	 * The parameters in the URL or in the request body aren't valid.
	 */
	ParamsNotValid = 400,

	/**
	 * The provided credentials are invalid.
	 */
	CredentialsInvalid = 401,

	/**
	 * The action is not allowed given the provided credentials.
	 */
	ActionNotAllowedWithCreds = 403,

	/**
	 * The requested resource doesn't exist.
	 */
	NotFound = 404,

	/**
	 * The request conflicts with an existing resource.
	 */
	ResourceConflicts = 409,

	/**
	 * The service has encountered an unexpected error.
	 */
	InternalServerError = 500,

	/**
	 * The service is temporarily unavailable.
	 */
	TemporarilyUnavailable = 503,
}

/**
 * Different types of events that trigger a workflow run.
 */
export enum WorkflowEvent {
	/**
	 * The workflow was triggered by anything
	 */
	any = "*",

	/**
	 * The workflow was triggered via a GIT push.
	 */
	push = "push",

	/**
	 * The workflow was triggered via a pull request.
	 */
	pullRequest = "pull_request",

	/**
	 * The workflow was trigger by an issue event.
	 */
	issue = "issue",
}

export enum WorkflowRunStatus {
	/**
	 * Any workflow state.
	 */
	any = "*",

	/**
	 * The workflow has been completed.
	 */
	completed = "completed",

	/**
	 * The workflow requires action.
	 */
	actionRequired = "action_required",

	/**
	 * The workflow as cancelled.
	 */
	cancelled = "cancelled",

	/**
	 * The workflow failed.
	 */
	failure = "failure",

	/**
	 * The workflow is neutral.
	 */
	neutral = "neutral",

	/**
	 * The workflow was skipped.
	 */
	skipped = "skipped",

	/**
	 * The workflow is stale.
	 */
	stale = "stale",

	/**
	 * The workflow was successful.
	 */
	success = "success",

	/**
	 * The workflow timed out.
	 */
	timedOut = "timed_out",

	/**
	 * The workflow is currently in progress.
	 */
	inProgress = "in_progress",

	/**
	 * The workflow has been queued.
	 */
	queued = "queued",

	/**
	 * The workflow has been requested.
	 */
	requested = "requested",

	/**
	 * The workflow is currently waiting.
	 */
	waiting = "waiting",

	/**
	 * The workflow is currently pending.
	 */
	pending = "pending",
}

/**
 * Represents the different reasons for the change in an issues state.
 */
export enum StateReason {
	/**
	 * The issue has been completed.
	 */
	completed = "completed",

	/**
	 * The issue was not planned.
	 */
	notPlanned = "not_planned",

	/**
	 * The issue was reopened.
	 */
	reopened = "reopened",
}

/**
 * Represents the different template variables that can be used in a PR template.
 */
export enum PRTemplateVars {
	/**
	 * The issue number template variable.
	 */
	issueNumber = "issue-num",

	/**
	 * The head branch template variable.
	 */
	headBranch = "head-branch",
}

/**
 * Represents the type of role in a GitHub organization.
 */
export enum OrgMemberRole {
	/**
	 * Any role.
	 */
	all = "all",

	/**
	 * The admin role.
	 */
	admin = "admin",

	/**
	 * The member role.
	 */
	member = "member",
}

/**
 * Represents the different types of log messages that can be printed to the GitHub console.
 */
export enum GitHubLogType {
	/**
	 * Normal log message.
	 */
	normal,

	/**
	 * Log message that is a notice.
	 */
	notice,

	/**
	 * Log message that is a warning.
	 */
	warning,

	/**
	 * Log message that is an error.
	 */
	error,
}

/**
 * Represents different types of releases.
 */
export enum ReleaseType {
	/**
	 * A preview release.
	 */
	preview = "preview",

	/**
	 * A production release.
	 */
	production = "production",
}

/**
 * Represents different types of events.
 */
export enum EventType {
	/**
	 * An issue event type.
	 */
	issue = "issue",

	/**
	 * A pull request event type.
	 */
	pullRequest = "pr",
}

/**
 * Represents if a number is an issue number, pull request number or neither.
 */
export enum IssueOrPullRequest {
	/**
	 * Represents an issue number.
	 */
	issue = 1,

	/**
	 * Represents a pull request number.
	 */
	pullRequest = 2,

	/**
	 * Represents neither an issue number or pull request number.
	 */
	neither = 3,
}
