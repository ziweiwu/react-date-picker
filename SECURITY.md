# Security Policy

## Supported versions

| Version | Supported          | Notes                                                        |
| ------- | ------------------ | ------------------------------------------------------------ |
| 1.x     | :white_check_mark: | Current release line.                                         |
| 0.1.x   | :x:                | Depends on end-of-life React 15/16 packages. Upgrade to 1.x.  |

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's
[security advisory form](https://github.com/ziweiwu/react-date-picker/security/advisories/new)
rather than opening a public issue.

Expect an acknowledgement within 7 days. If the report is accepted, a fix
and an advisory will normally follow within 30 days; if it is declined, you
will get an explanation of why.

## Scope

This package is a client-side React component with no network or filesystem
access. The most likely classes of issue are:

- a vulnerable transitive dependency,
- unsanitised rendering of caller-supplied content,
- a defect that breaks a documented accessibility guarantee.

Runtime dependencies are audited on every push (`npm audit --omit=dev`) and
the source is scanned with CodeQL.
