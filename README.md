# CB Code Tracker

A Visual Studio Code extension that displays the current time in the status bar and tracks coding time.

## Features

- Displays current time in the status bar with a clock icon
- Click on the time to see it in an information message
- Time updates automatically every second
- Shows stats command in command palette

## Installation

There are two ways to install this extension:

1. Through VSIX file:
   - Download the .vsix file
   - Open VS Code
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
   - Type "Install from VSIX" and select it
   - Navigate to the downloaded .vsix file and select it

2. Through VS Code Quick Open:
   - Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS)
   - Paste `ext install cb-code-tracker`

## Commands

This extension contributes the following commands:

* `cb-code-tracker.sts`: Show Today's Stats
* `cb-code-tracker.showTime`: Show Current Time

## Requirements

No additional requirements needed.

## Release Notes

### 0.0.1

Initial release:
- Added status bar time display
- Added basic commands for showing time and stats
