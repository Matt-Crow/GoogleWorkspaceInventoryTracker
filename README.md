# Google Workspace Inventory Tracker

A Google Apps Script project for managing an inventory and receiving updated.
You can read more about the problem domain in the [Software Requirement Specification](https://docs.google.com/document/d/1zdaqsVS-UOCbw-VkDh3TJ3JkHn0hiCWYqIpun7r6jnY/edit?usp=sharing)

## Installation

1. Install `clasp` through the terminal: `npm install @google/clasp -g`
2. run `clasp login`
3. log in with Google in the browser window clasp opened
4. in your Google Drive, create a new spreadsheet
5. from Google Sheets, choose the menu option `Extensions` then `Apps Script`
6. from the Google Script editor, go to the `project settings` on the left
7. copy the `Script ID`
8. copy the file `template.clasp.json` as `.clasp.json`, then fill it out
9. `clasp push` 
10. reload the Google sheet
11. from the menu, select `G-WIT` => `Set up`


## Helpful Links

- [clasp](https://developers.google.com/apps-script/guides/clasp)
- [Google Script documentation](https://developers.google.com/apps-script/reference)
- [time-based triggers](https://developers.google.com/apps-script/guides/triggers/installable)