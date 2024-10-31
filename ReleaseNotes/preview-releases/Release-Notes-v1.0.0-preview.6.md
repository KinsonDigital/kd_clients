<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.6
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, which is why your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#27](https://github.com/KinsonDigital/Velaptor/issues/27) - Added the following functions to all GitHub HTTP clients to manage headers.
   - `getHeader()`
   - `updateOrAdd()`
   - `clearHeaders()`
   - `containsHeader()`
2. [#22](https://github.com/KinsonDigital/Velaptor/issues/22) - Added the ability to upload assets to a GitHub release.
   - The new function named `uploadAssets` was added to the `ReleaseClient` class.

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#22](https://github.com/KinsonDigital/Velaptor/issues/22) - Removed the functions `getReleaseByTag` and `getReleaseByName`.
   - These functions were replaced by the function named `getRelease`.
   - The `getRelease` function now uses the options parameter named `ReleaseOptions`.
2. [#19](https://github.com/KinsonDigital/Velaptor/issues/19) - Changed the `token` constructor parameter of the `OrgClient` class from optional to required.

<h2 align="center" style="font-weight: bold;">Bug Fixes 🐛</h2>

1. [#27](https://github.com/KinsonDigital/Velaptor/issues/27) - Fixed a bug where attempting to update a file in a repository where the file already exists throws an error saying that it already exists.
