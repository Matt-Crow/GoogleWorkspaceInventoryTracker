# Google Workspace Inventory Tracker

A Google Apps Script project for managing an inventory and receiving updated.
You can read more about the problem domain in the [Software Requirement Specification](https://docs.google.com/document/d/1zdaqsVS-UOCbw-VkDh3TJ3JkHn0hiCWYqIpun7r6jnY/edit?usp=sharing)

## Installation

### Easy Installation

1. (optional if installing from a release) `python catgs.py`
2. copy the contents of `Code.js` to the clipboard
3. in your Google Drive, create a new spreadsheet
4. from Google Sheets, choose the menu option `Extensions` then `Apps Script`
5. select everything in the `Code.js` file in the browser, then paste what you copied from step 2, then save
6. reload the Google Sheet
7. from Google sheets, select `G-WIT` => `Set up` (it takes a bit for the menu to show up)
8. when asked to authorize, click `Continue`
9. sign in with your Google account
10. click `Advanced`, then `Go to ... (unsafe)`
11. click `allow`
12. rerun `G-WIT` => `Set up`


### Developer Installation

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
12. from Google sheets, select `G-WIT` => `Set up`
13. when asked to authorize, click `Continue`
14. sign in with your Google account
15. click `Advanced`, then `Go to ... (unsafe)`
16. click `allow`
17. rerun `G-WIT` => `Set up`

## Menu options

- `Set up`: creates any missing resources, such as sheets or forms
- `Reset workspace`: **deletes all application data**, then performs setup
    - hint: you can rename a sheet to prevent it from being deleted by this
- `Regenerate stock update form`: adds all products from the `inventory` sheet to the stock update form
- `Test`: runs developer tests 

## Using the application

- *How do I start tracking a new product?* 
    You can either manually enter data in the `inventory` sheet (only the name is required), 
    or you can use the `new product` form by clicking the `New product type form URL` link on the `settings` sheet.
- *How do I update how many of a product are in stock?*
    You can either manually enter data in the `inventory` sheet
    or you can use the `stock update` form by clicking the `Stock update form URL` link on the `settings` sheet.
- *How do I change which emails I receive from the system?*
    You can either edit your preferences in the `users` sheet, 
    or you can use the `user` form by clicking the `User form URL` link on the `settings` sheet.

## Known issues

- *I just added an item to the stock, but it isn't showing up in the stock update form.*
    The program only changes the stock update form whenever it sends it, so the new item will show up the next time it sends.

## Helpful Links

- [clasp](https://developers.google.com/apps-script/guides/clasp)
- [Google Script documentation](https://developers.google.com/apps-script/reference)
- [time-based triggers](https://developers.google.com/apps-script/guides/triggers/installable)