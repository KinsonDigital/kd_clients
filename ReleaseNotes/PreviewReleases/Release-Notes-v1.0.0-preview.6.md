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

<h2 align="center" style="font-weight: bold;">Bug Fixes 🐛</h2>

1. [#27](https://github.com/KinsonDigital/Velaptor/issues/27) - Fixed a bug where attempting to update a file in a repository where the file already exists throws an error saying that it already exists.
