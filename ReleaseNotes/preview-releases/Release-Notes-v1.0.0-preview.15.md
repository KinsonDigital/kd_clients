<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.15
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, so your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">Features </h2>

1. [#64](https://github.com/KinsonDigital/kd_clients/issues/64) - Added a function to the `ReleaseClient` that checks if a GitHub release asset exists.
2. [#61](https://github.com/KinsonDigital/kd_clients/issues/61) - Added various functions to the `ReleaseClient` to download assets from a GitHub release.

<h2 align="center" style="font-weight: bold;">Enhancement</h2>

1. [#101](https://github.com/KinsonDigital/kd_clients/issues/101) - Added throttling to secondary rate limiting to prevent secondary rate limits from being hit.
2. [#43](https://github.com/KinsonDigital/kd_clients/issues/43) - Added an options parameter to the `getVariables()` function in the `RepoClient` and `OrgClient` classes. These options will be used to signify how to trim the variable values.

<h2 align="center" style="font-weight: bold;">Bugs</h2>

1. [#111](https://github.com/KinsonDigital/kd_clients/issues/111) - Fixed a bug with rate limiting being applied for api requests that do not use it. Also, fixed an issue with updating a GitHub release after uploading an asset to a release.

<h2 align="center" style="font-weight: bold;">CICD</h2>

1. [#100](https://github.com/KinsonDigital/kd_clients/issues/100) - Improve the release workflow
