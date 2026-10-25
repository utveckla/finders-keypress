# Security Policy

Finders Keypress runs entirely in the browser. It makes no network requests,
sets no cookies, and stores no data outside the current page session, so its
attack surface is small. Even so, security reports are welcome.

## Reporting a vulnerability

Please report suspected vulnerabilities privately using GitHub's
[security advisory](https://github.com/utveckla/finderskeypress/security/advisories/new)
form rather than opening a public issue.

Include steps to reproduce and the affected browser and version. You can expect
an initial response within a few days.

## Scope

In scope:

- The application code in `index.html`, `css/`, `js/`, and `sw.js`.
- The service worker caching behavior.

Out of scope:

- Issues that require a compromised browser or operating system.
- The vendored Chart.js library (report those upstream to Chart.js).
