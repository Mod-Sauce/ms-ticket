---
name: Bug Report
description: Report a bug you found
fields:
  - name: title
    label: Title
    type: text
    required: true
    placeholder: Short description of the bug
    maxLength: 100
  - name: mclo_gs_link
    label: McLogs Link to your log
    type: url
    required: true
    pattern: "^https?://(www\\.)?mclo\\.gs\\/.+"
    patternMessage: Must be a valid mclo.gs link
    placeholder: https://mclo.gs/...
  - name: description
    label: Description
    type: textarea
    required: true
    placeholder: Describe what happened, what you expected, and steps to reproduce
  - name: reproduce_steps
    label: Steps to Reproduce
    type: textarea
    required: false
    placeholder: 1. ... 2. ... 3. ...
  - name: screenshots
    label: Screenshots
    type: file
    required: false
---

## Bug Report

Please fill out the form above. The more details you provide, the faster we can help!
