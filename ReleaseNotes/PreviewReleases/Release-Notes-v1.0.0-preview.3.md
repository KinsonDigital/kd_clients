<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.3
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, which is why your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#6](https://github.com/KinsonDigital/kd_clients/issues/6) - Made the following functions public in the `WebApiClient` class.
    - `requestGET`
    - `requestPOST`
    - `requestPATCH`
    - `requestDELETE`
    - `requestPUT`
1. [#6](https://github.com/KinsonDigital/kd_clients/issues/6) - Added the following error classes that can be thrown in the various clients.
    - BadCredentialsError
    - GitError
    - IssueError
    - LabelError
    - MilestoneError
    - NuGetError
    - OrganizationError
    - ProjectError
    - PullRequestError
    - ReleaseError
    - RepoError
    - TagError
    - UsersError
    - WorkflowError
    - XError

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#6](https://github.com/KinsonDigital/kd_clients/issues/6) - Implemented the following breaking changes:
    - Changed the order of the `GraphQlClient` constructor params from `(token: string, ownerName?:string, repoName?:string)` to `(ownerName:string, repoName:string, token:string)`.
    - Changed the `GraphQlClient` constructor parameters `ownerName` and `repoName` from optional to required.
    - Changed the `GitHubClient` constructor parameters `ownerName` and `repoName` from optional to required.
    - Refactored the name of the `GitClient` constructor parameter named `repoOwner` to `ownerName`.
    - Refactored the name of the `RepoClient` constructor parameter named `repoOwner` to `ownerName`.


<h2 align="center" style="font-weight: bold;">Bug Fixes 🐛</h2>


1. [#6](https://github.com/KinsonDigital/kd_clients/issues/6) - Fixed import issue in mod files.

