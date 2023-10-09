<div align="center">

  ![logo](https://raw.githubusercontent.com/KinsonDigital/kd_clients/main/Images/kd_clients-logo.png)
</div>


<h1 style="border:0;font-weight:bold" align="center">kd_clients</h1>


<div align="center">

[![Build PR Status Check](https://img.shields.io/github/actions/workflow/status/KinsonDigital/kd_clients/build-status-check.yml?label=%E2%9A%99%EF%B8%8FBuild)](https://github.com/KinsonDigital/kd_clients/actions/workflows/build-status-check.yml)
[![Unit Test PR Status Check](https://img.shields.io/github/actions/workflow/status/KinsonDigital/kd_clients/test-status-check.yml?label=%F0%9F%A7%AATests)](https://github.com/KinsonDigital/kd_clients/actions/workflows/test-status-check.yml)

[![Good First GitHub Issues](https://img.shields.io/github/issues/kinsondigital/kd_clients/good%20first%20issue?color=7057ff&label=Good%20First%20Issues)](https://github.com/KinsonDigital/kd_clients/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
[![Discord](https://img.shields.io/discord/481597721199902720?color=%23575CCB&label=chat%20on%20discord&logo=discord&logoColor=white)](https://discord.gg/qewu6fNgv7)
</div>

<h2 style="font-weight:bold;" align="center" >!! NOTICE !!</h2>

This library is still under development and is not at v1.0.0 yet!!  However, all of the major features are available, so we encourage you to use it and provide feedback.  That is what open source is all about. 🥳

<br/>

<h2 style="font-weight:bold;" align="center">📖 About kd_clients 📖</h2>

kd_clients is a collection of various HTTP clients that help make talking to APIs easier.  An example of this are the GitHub clients.  These clients take care of pagination and also gives you the option to choose which page and how many pages you want to return. This removes the worry of having to deal with pagination.  All data returned has a model associated with it to provide types for typescript.

The client functions are more pragmatic and follow a more natural way of dealing with clients.  If you want to deal with tags, you use the `TagClient`, or use the `RepoClient` for repo related information.  All of the clients will follow the same "pattern" of pagination as well as how they are used.

Uuuhh..why?

Over time, I have been building various scripts, tools, and infrastructure using the deno platform, for all of the repositories in the KinsonDigital organization.  As my infrastructure, scripts, and tools grew, I kept needing to access various APIs.  I also did not want to reinvent the wheel every time, or have to copy and paste the HTTP client code every time I needed to talk to a public API.  So I finally decided to "package" all of the HTTP client code to use it everywhere, as well as make it available for the public to use.  This is the more responsible thing to do.  😉

<br/>

<h2 style="font-weight:bold;" align="center">🙏🏼 Contributing 🙏🏼</h2>

Interested in contributing? If so, click [here](https://github.com/KinsonDigital/.github/blob/main/docs/CONTRIBUTING.md) to learn how to contribute your time or [here](https://github.com/sponsors/KinsonDigital) if you are interested in contributing your funds via one-time or recurring donation.


<h2 style="font-weight:bold;" align="center">🔧 Maintainers 🔧</h2>

![x-logo-dark-mode](https://raw.githubusercontent.com/KinsonDigital/.github/main/Images/x-logo-16x16-dark-mode.svg#gh-dark-mode-only)
![x-logo-light-mode](https://raw.githubusercontent.com/KinsonDigital/.github/main/Images/x-logo-16x16-light-mode.svg#gh-light-mode-only)
[Calvin Wilkinson](https://twitter.com/KDCoder) (KinsonDigital GitHub Organization - Owner)


![x-logo-dark-mode](https://raw.githubusercontent.com/KinsonDigital/.github/main/Images/x-logo-16x16-dark-mode.svg#gh-dark-mode-only)
![x-logo-light-mode](https://raw.githubusercontent.com/KinsonDigital/.github/main/Images/x-logo-16x16-light-mode.svg#gh-light-mode-only)
[Kristen Wilkinson](https://twitter.com/kswilky) (KinsonDigital GitHub Organization - Project Management, Documentation, Tester)

<br/>

<h2 style="font-weight:bold;" align="center">🚔 Licensing And Governance 🚔</h2>


<div align="center">

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat)](https://github.com/KinsonDigital/.github/blob/main/docs/code_of_conduct.md)
[![GitHub](https://img.shields.io/github/license/kinsondigital/kd_clients)](https://github.com/KinsonDigital/kd_clients/blob/preview/LICENSE.md)
</div>


This software is distributed under the very permissive MIT license and all dependencies are distributed under MIT-compatible licenses.
This project has adopted the code of conduct defined by the **Contributor Covenant** to clarify expected behavior in our community.
