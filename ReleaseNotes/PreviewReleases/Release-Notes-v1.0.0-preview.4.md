<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd_clients Preview Release Notes - v1.0.0-preview.4
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, which is why your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#8](https://github.com/KinsonDigital/Velaptor/issues/8) - Created default modules for all models.
2. [#12](https://github.com/KinsonDigital/Velaptor/issues/12) - Improved the pull request client.

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#12](https://github.com/KinsonDigital/Velaptor/issues/12) - Introduced the following breaking changes:
   - Refactored the name of the `RequestResponseModel` type to `GraphQlRequestResponseModel`
   - Refactored the name of the `PullRequestClient` function from `requestReviewer` to `requestReviewers`
   - Refactored the name of the `PullRequestClient.requestReviewer` function parameter from `reviewer` to `reviewers`
