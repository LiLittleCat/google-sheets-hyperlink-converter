# Google Sheets Link Formatter

[中文文档](./README_CN.md)

A simple Chrome extension for quickly converting URLs into hyperlink formulas in Google Sheets.

## Features

- One-click conversion of URLs to Google Sheets HYPERLINK formulas
- Automatic webpage title fetching for link text
- Supports Chinese and English interfaces
- Clean sidebar interface
- Copy results to clipboard

## Installation

1. Download the latest `.zip` file from the [Releases](../../releases) page and extract it
2. Open Chrome browser and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extracted folder

## Usage

1. After installation, open any Google Sheets document
2. Click the extension icon in the toolbar
3. Paste the URL you want to convert in the input box
4. The HYPERLINK formula will be generated automatically
5. Click the "Copy" button to copy the formula to clipboard
6. Paste it in Google Sheets

## Language Support

- English
- Simplified Chinese

## Notes

- Only works in Google Sheets
- Requires internet connection to fetch webpage titles
- If title cannot be fetched, URL will be used as link text 