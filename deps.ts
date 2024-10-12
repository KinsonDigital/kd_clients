// ----IMPORTS----

// Official Deno Modules
import { exists, existsSync, walkSync, ensureDirSync } from "@std/fs";
import { extname, basename, isAbsolute } from "@std/path";
import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import { assert, assertEquals, assertThrows, assertRejects, equal } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy, stub, returnsNext, returnsArg } from "@std/testing/mock";
import { oauth1a } from "jsr:@nexterias/twitter-api-fetch@3.0.1";

// Local Core Types
import { GitHubClient } from "./core/GitHubClient.ts";
import { GraphQlClient } from "./core/GraphQlClient.ts";

// Local Core Models
import {
	AssetModel,
	CommitModel,
	FileContentModel,
	GitHubVariablesModel,
	GitHubVarModel,
	IssueModel,
	LabelModel,
	MilestoneModel,
	ProjectModel,
	PullRequestHeadOrBaseModel,
	PullRequestInfoModel,
	PullRequestModel,
	ReleaseModel,
	RepoModel,
	TagModel,
	UserModel,
	WorkflowRunModel,
	WorkflowRunsModel,
} from "./core/Models/mod.ts";

// Local GraphQL Models
import {
	ErrorModel,
	GitBranchModel,
	GraphQlRequestResponseModel,
	LocationModel,
	PageInfoModel,
	RawGetBranchTargetModel,
	RawGitBranchModel,
	RawRefsGetBranchModel,
} from "./core/Models/GraphQlModels/mod.ts";

// Local GitHub Client Errors
import {
	AuthError,
	GitError,
	IssueError,
	LabelError,
	MilestoneError,
	OrganizationError,
	ProjectError,
	PullRequestError,
	ReleaseError,
	RepoError,
	TagError,
	UsersError,
	WorkflowError,
} from "./GitHubClients/Errors/mod.ts";

// Package Client Errors
import { NuGetError } from "./PackageClients/Errors/NuGetError.ts";

// Other Client Errors
import { XError } from "./OtherClients/Errors/XError.ts";

// Local
import { Utils } from "./core/Utils.ts";
import { Guard } from "./core/Guard.ts";
import { GitHubHttpStatusCodes } from "./core/Enums.ts";

// ----EXPORTS----

// Official Deno Modules
export { ensureDirSync, exists, existsSync, walkSync };
export { basename, extname, isAbsolute };
export { decodeBase64, encodeBase64 };
export { assert, assertEquals, assertRejects, assertThrows, equal };
export { assertSpyCall, assertSpyCalls, returnsArg, returnsNext, spy, stub };
export { oauth1a };

// Local Core Types
export { GitHubClient, GraphQlClient };

// Local Core Models
export type {
	AssetModel,
	CommitModel,
	FileContentModel,
	GitHubVariablesModel,
	GitHubVarModel,
	IssueModel,
	LabelModel,
	MilestoneModel,
	ProjectModel,
	PullRequestHeadOrBaseModel,
	PullRequestInfoModel,
	PullRequestModel,
	ReleaseModel,
	RepoModel,
	TagModel,
	UserModel,
	WorkflowRunModel,
	WorkflowRunsModel,
};

// Local GraphQL Models
export type {
	ErrorModel,
	GitBranchModel,
	GraphQlRequestResponseModel,
	LocationModel,
	PageInfoModel,
	RawGetBranchTargetModel,
	RawGitBranchModel,
	RawRefsGetBranchModel,
};

// Local GitHub Client Errors
export {
	AuthError,
	GitError,
	IssueError,
	LabelError,
	MilestoneError,
	OrganizationError,
	ProjectError,
	PullRequestError,
	ReleaseError,
	RepoError,
	TagError,
	UsersError,
	WorkflowError,
};

// Package Client Errors
export { NuGetError };

// Other Client Errors
export { XError };

// Local
export { GitHubHttpStatusCodes, Guard, Utils };
