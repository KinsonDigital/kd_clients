### Pre-Release ToDo List

```[tasklist]
### Complete the following items to perform a release.
- [ ] All of the issues in the assigned milestone are closed and all issue tasks are complete.
- [ ] The `🚀Preview Release` label has been added to this issue.
- [ ] This issue is assigned to a project.
- [ ] This issue is assigned to a milestone.
- [ ] All of the unit tests have been executed locally and have passed. _(Check out the appropriate branch before running tests)_.
- [ ] The version has been updated. _(All changes made directly on a 'prev-release' branch)_.
- [ ] The release notes have been created and added. _(All changes made directly on a 'prev-release' branch)_.
- [ ] All manual QA Testing completed. _(if applicable)_
- [ ] The pull request has been approved and merged into the _**preview**_ branch before performing the release. _(Releases are performed on the preview branch)_.
- [ ] The preview release has been completed. _(The release is performed by running the `🚀Release` workflow)_.
```

### Post-Release ToDo List

```[tasklist]
### Verify that release went smoothly.
- [ ] The GitHub release has been created and is correct. 
- [ ] An announcement of the release on [X](https://x.com/KDCoder) has been verified. _(if applicable)_
- [ ] An announcement has been pushed to the [Discord](https://discord.gg/qewu6fNgv7) channel. _(if applicable)_
- [ ] Documentation website tutorials/guides have have been released. _(if applicable)_
- [ ] Documentation website tutorials/guides have have been released. _(if applicable)_
- [ ] Documentation website API changes have been released. _(if applicable)_
```

### Additional Information:

**_<details closed><summary>Unit Tests</summary>_**

Reasons for local unit test execution:
- Unit tests might pass locally but not in the CI environment during the status check process or vice-versa.
- Tests might pass on the developer's machine but not necessarily on the code reviewer's machine.
</details>

---

**_<details closed><summary>Version Updating</summary>_**

The version can be updated by setting the values of the `version` JSON value in the `deno.json` file.

``` json
{
	"version": "v1.2.3-preview.4",
    ...
}
```
</details>

---

### Code of Conduct

- [x]  I agree to follow this project's Code of Conduct
