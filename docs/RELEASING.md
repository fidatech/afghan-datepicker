# Release and publication runbook

## Current public release mechanism

A successful main-branch **Tests and build** run triggers the
**Publish public beta release** workflow. It assembles an npm tarball and
an offline documentation ZIP, then creates (once) the public GitHub
prerelease v0.2.0-beta.1, including both assets.

All source code is already publicly visible in the GitHub repository.
A GitHub beta release does **not** prove that the npm registry is published.

## Enable public documentation (one-time setting)

The file .github/workflows/pages.yml builds a static documentation site and
uploads it using GitHub Pages Actions. The repository owner must enable Pages
in GitHub repository Settings -> Pages -> Build and deployment -> Source:
GitHub Actions. GitHub's default GITHUB_TOKEN cannot itself activate Pages
for a repository that has never enabled the service.

After Pages is enabled, rerun the Pages workflow in Actions or push a small
docs change. Verify that the GitHub Pages deployment was successful before
linking to the public site.

The expected public address for a Pages project site (once deployed) is
https://fidatech.github.io/afghan-datepicker/ . Do not advertise that as a
live URL until the deployment is confirmed.

## npm publish (separate permission)

npm publishing is **not automated** on every GitHub push. The manual
.github/workflows/npm-publish.yml workflow needs an authorized npm identity
and a configured npm Trusted Publisher for GitHub Actions. Do not paste npm
passwords, tokens or 2FA codes into ChatGPT or an issue.

1. Register/sign in to npmjs.com and ensure the @fidatech scope can be used.
2. Confirm the package name is available or under your authorized scope.
3. Create/configure a Trusted Publisher with:
   owner: fidatech
   repo: afghan-datepicker
   filename: npm-publish.yml
   provider: GitHub Actions
4. Select authorization to publish releases and ensure the package ownership
   is correctly established. First publication may require an npm-account
   bootstrap publish from an authenticated workstation.
5. Once tests, package metadata and ownership are verified, run the manual
   npm workflow in GitHub Actions to publish a beta (dist-tag beta).
6. Check the actual registry page and npm install before claiming success.

Official npm trusted publisher documentation:
https://docs.npmjs.com/trusted-publishers/

## Other registries and mobile SDKs

- No Composer/Packagist package exists: this JavaScript browser component
  does not supply a PHP runtime class or Laravel service provider.
- No PyPI package exists: Python/Django servers serve static JS/CSS instead.
- No pub.dev package exists: the Flutter example is independent native sample
  code and would require its own maintained Flutter package.
- No published React Native package exists: the TSX example is a prototype
  using the DOM-free calendar helpers, not the browser datepicker.

## Checklist before a stable 1.0 release

- Native-speaker review of Pashto/Dari weekdays, months and accessibility.
- Browser CI passing on Chrome, Firefox and WebKit.
- Component usability and responsive layout review on mobile.
- npm ownership/trusted publisher setup and installation verification.
- React Native and Flutter build/test suites if advertised as supported.
- LICENSE, third-party notices, documentation and changelog audited.
