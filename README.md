# Google Workspace Inventory Tracker

A Google Apps Script project for managing an inventory and receiving updated.
You can read more about the problem domain in the [Software Requirement Specification](https://docs.google.com/document/d/1zdaqsVS-UOCbw-VkDh3TJ3JkHn0hiCWYqIpun7r6jnY/edit?usp=sharing)


## Easy Installation

1. (optional if installing from a release) `python catgs.py`
2. copy the contents of `Code.js` to the clipboard
3. in your Google Drive, create a new spreadsheet
4. from Google Sheets, choose the menu option `Extensions` then `Apps Script`
5. select everything in the `Code.js` file in the browser, then paste what you copied from step 2
6. reload the Google Sheet


## Developer Installation

1. `cd src`
2. Install `clasp` through the terminal: `npm install @google/clasp -g`
3. run `clasp login`
4. log in with Google in the browser window clasp opened
5. in your Google Drive, create a new spreadsheet
6. from Google Sheets, choose the menu option `Extensions` then `Apps Script`
7. from the Google Script editor, go to the `project settings` on the left
8. copy the `Script ID`
9. copy the file `template.clasp.json` as `.clasp.json`, then fill it out
10. `clasp push`
11. reload the Google Sheet


## Helpful Links

- [clasp](https://developers.google.com/apps-script/guides/clasp)
- [Google Script documentation](https://developers.google.com/apps-script/reference)
- [time-based triggers](https://developers.google.com/apps-script/guides/triggers/installable)