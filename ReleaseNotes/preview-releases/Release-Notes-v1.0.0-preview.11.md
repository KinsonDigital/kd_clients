<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.11
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, which is why your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#65](https://github.com/KinsonDigital/kd_clients/issues/65) - Added the following functions to the `ReleaseClient`:
    - Added the function named `assetExists` to check if a single release asset exists.
    - Added the function named `deleteAsset` to delete a single asset from a release.
    - Added the function named `uploadAsset` to upload a single asset to a release.

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#65](https://github.com/KinsonDigital/kd_clients/issues/65) - Introduced the following breaking changes:
    - Changed the parameter type for the `uploadAssetsByReleaseName` function `filePaths` from `string | string[]` to `string[]`.
    - Changed the parameter type for the `uploadAssetsByReleaseTag` function `filePaths` from `string | string[]` to `string[]`.

<h2 align="center" style="font-weight: bold;">Other 🪧</h2>

1. [#63](https://github.com/KinsonDigital/kd_clients/issues/63) - Improved release process.
