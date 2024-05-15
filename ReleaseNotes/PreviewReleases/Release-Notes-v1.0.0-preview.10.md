<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.10
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, so your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#9](https://github.com/KinsonDigital/kd_clients/issues/9) - Added an error type named `AuthError`.
2. [#53](https://github.com/KinsonDigital/kd_clients/issues/53) - Added a new data model named `AssetModel` to represent a release asset.
3. [#53](https://github.com/KinsonDigital/kd_clients/issues/53) - Added a new property named `assets` to the `ReleaseModel`.type.

4. [#53](https://github.com/KinsonDigital/kd_clients/issues/53) - Added the following functionality to the `ReleaseClient`:
   - A new function named `getReleaseById` was added to get a release using a release ID.
   - A new function named `getReleaseByTag` was added to get a release using a release tag.
   - A new function named `getAllAssetsByTag` was added to get all release assets using a release tag name.
   - A new function named `getAsset` was added to get a single asset from a release using a combination of the release ID or tag and the asset ID or tag.
   - A new function named `getReleaseByName` was added to return a release that matches a release name.
   - A new function named `uploadAssetsByReleaseName` was added to upload assets to a release that matches a release name.
   - A new function named `uploadAssetsByReleaseTag` was added to upload assets to a release that matches a release tag.
   - A new function named `downloadAssetById` was added to download a single asset using an asset ID.
   - A new function named `downloadAllAssetsByReleaseName` was added to download all release assets using a release name.
   - A new function named `downloadAllAssetsByReleaseTag` was added to download all release assets using a release tag.
   - A new function named `getLatestRelease` was added to get the latest release.

<h2 align="center" style="font-weight: bold;">Enhancements ✨</h2>

1. [#9](https://github.com/KinsonDigital/kd_clients/issues/9) - Updated all clients to check for authentication issues.
   - These will now throw an `AuthError` if authentication has failed.

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#9](https://github.com/KinsonDigital/kd_clients/issues/9) - Introduced the following breaking changes:
   - Changed the name of the 'toReleaseBy' parameter to `tagOrTitle` for the `uploadAssets()` function in the `ReleaseClient` class.
   - Moved the `XError` type from the `GitHubClients.Errors.mod.ts` file to the `OtherClients.Errors.mod.ts` file.
   - Moved the `NuGetError` type from the `GitHubClients.Errors.mod.ts` file to the `PackageClients.Errors.mod.ts` file.
   - Refactored the `getPullRequests()` function return type from `Promise<[PullRequestModel[], Response]>` to `Promise<PullRequestModel[]>` in the `PullRequestClient` class.
   - Refactored the `getIssues()` function return type from `Promise<[IssueModel[], Response]>` to `Promise<IssueModel[]>` in the `IssueClient` class.
   - Refactored the `getOwnerRepos()` function return type from `Promise<[RepoModel[], Response]>` to `Promise<RepoModel[]>` in the `RepoClient` class.
   - Changed the name of the `getOwnerRepos()` function to `getAllRepos()`.
   - Refactored the `getTags()` function return type from `Promise<[TagModel[], Response]>` to `Promise<TagModel[]>` in the `TagClient` class.
   - Refactored the `getWorkflowRuns()` function return type from `Promise<[WorkflowRunModel[], Response]>` to `Promise<WorkflowRunModel[]>` in the `WorkflowClient` class.

2. [#53](https://github.com/KinsonDigital/kd_clients/issues/53) - Introduced the following breaking changes:
   - Removed the `getRelease` function from the `ReleaseClient`.
       - This has been replaced by the new function named `getReleaseByName`.
   - Removed the `uploadAssets` function from the `ReleaseClient`.
       - The `uploadAssetsByReleaseName` function has replaced this.
   - The GitHub token parameter for the `ReleaseClient` was changed from optional to required.
   - Removed the `ReleaseOptions` interface.

<h2 align="center" style="font-weight: bold;">Dependency Updates 📦</h2>

1. [#58](https://github.com/KinsonDigital/kd_clients/pull/58) - Updated the following deno standard modules:
    - Updated _**exists**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**extname**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**existsSync**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**walkSync**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**ensureDirSync**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**basename**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**isAbsolute**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**decodeBase64**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**encodeBase64**_ from _**0.203.0**_ to _**0.224.0**_
    - Updated _**assert**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**assertEquals**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**assertThrows**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**assertRejects**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**equal**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**assertSpyCall**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**assertSpyCalls**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**spy**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**stub**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**returnsNext**_ form _**0.204.0**_ to _**0.224.0**_
    - Updated _**returnsArg**_ form _**0.204.0**_ to _**0.224.0**_

<h2 align="center" style="font-weight: bold;">Other 🪧</h2>

1. [#51](https://github.com/KinsonDigital/kd_clients/issues/51) - Fixed an issue with the release process regarding sending release tweets.
2. [#40](https://github.com/KinsonDigital/kd_clients/issues/40) - Fixed an issue in the release process to properly close milestones.
