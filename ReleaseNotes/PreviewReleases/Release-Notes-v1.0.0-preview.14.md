<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.14
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, so your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#85](https://github.com/KinsonDigital/kd_clients/issues/85) - Added a new function with the name `getAllBranches()` to the `GitClient` class that returns all git branches.
2. [#83](https://github.com/KinsonDigital/kd_clients/issues/83) - Added a new function named `getAllReleases()` the `ReleaseClient` class.
   - This will return all releases for a GitHub repository.
3. [#78](https://github.com/KinsonDigital/kd_clients/issues/78) - Added the following functions to update a release in the `ReleaseClient` class.
   - `updateReleaseById()`
   - `updateReleaseByTag()`

<h2 align="center" style="font-weight: bold;">Enhancements 💎</h2>

1. [#82](https://github.com/KinsonDigital/kd_clients/issues/82) - Created a new type with the name `State` to represent the state of an issue or pull request.  Updated the `state` property type to this new type in the `IssueModel` and `PullRequestModel` types.

<h2 align="center" style="font-weight: bold;">Bug Fixes 🐛</h2>

1. [#91](https://github.com/KinsonDigital/kd_clients/issues/91) - Fixed a bug where the `fileExists()` function in the `RepoClient` class was reporting the incorrect result.

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#84](https://github.com/KinsonDigital/kd_clients/issues/84) - Refactored parameters with the name  `branchName` to `ref` in the following functions in the `RepoClient` class:
   - `getFileContent()`
   - `fileExists()`
2. [#77](https://github.com/KinsonDigital/kd_clients/issues/77) - Introduced the following breaking changes by renaming the functions below:
   - Renamed the function `milestoneExists()` to `exists` in the `MilestoneClient` class
   - Renamed the function `labelExists()` to `exists` in the `LabelClient` class
   - Renamed the function `pullRequestExists()` to `exists` in the `PullRequestClient` class
   - Renamed the function `openPullRequestExists()` to `openExists` in the `PullRequestClient` class
   - Renamed the function `closedPullRequestExists()` to `closedExists` in the `PullRequestClient` class
   - Renamed the function `issueExists()` to `exists` in the `IssueClient` class
   - Renamed the function `openIssueExists()` to `openExists` in the `IssueClient` class
   - Renamed the function `closedIssueExists()` to `closedExists` in the `IssueClient` class
   - Renamed the function `repoVariableExists()` to `variableExists` in the `RepoClient` class
   - Renamed the function `tagExists()` to `exists` in the `TagClient` class
   - Renamed the function `packageWithVersionExists()` to `exists` in the `NuGetClient` class
   - Removed the `packageExists()` function in the `NuGetClient` class
   - Changed the `exists()` function parameter `version` to an optional parameter in the `NuGetClient` class

<h2 align="center" style="font-weight: bold;">Dependency Updates 📦</h2>

1. [#88](https://github.com/KinsonDigital/kd_clients/pull/88) - Upgraded to deno _**v2.0.0**_.
2. [#86](https://github.com/KinsonDigital/kd_clients/pull/86) - Updated kinsondigital/infrastructure action to _**v14.0.0**_.

<h2 align="center" style="font-weight: bold;">Technical Debt 🧽</h2>

1. [#77](https://github.com/KinsonDigital/kd_clients/issues/77) - Renamed client functions to simplify and reduce verbosity of API.

<h2 align="center" style="font-weight: bold;">Configuration 🛠️</h2>

1. [#79](https://github.com/KinsonDigital/kd_clients/issues/79) - Setup [kd_client](https://github.com/kinsondigital/kd_clients).
2. [#72](https://github.com/KinsonDigital/kd_clients/issues/72) - Migrated the project from denoland to JSR.
