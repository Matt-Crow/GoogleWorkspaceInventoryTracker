# Google Workspace Inventory Tracker

A Google Apps Script project for managing an inventory and receiving updates.
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
- `Regenerate remove item form`: adds all items from the `inventory` sheet to the remove item form
- `Tests`: runs developer tests 

## Using the application

- *How do I start tracking a new item?* 
    You can either manually enter data in the `inventory` sheet (only the name is required), 
    or you can use the `new item` form by clicking the `New item form URL` link on the `settings` sheet.
- *How do I update how many of an item are in the inventory?*
    You can either manually enter data in the `inventory` sheet
    or you can use the inventory form by clicking the `inventory form URL` link on the `settings` sheet.
- *How do I change which emails I receive from the system?*
    You can either edit your preferences in the `users` sheet, 
    or you can use the `user` form by clicking the `User form URL` link on the `settings` sheet.
- *How do I send out the inventory form email?*
    You can send the email at any time by going to the Google Sheets menu, then selecting `G-WIT` => `Inventory form` => `Send inventory form`
    or you can make it automatically send the email by setting the `Inventory form interval` setting to a number, then going to the menu and selecting `G-WIT` => `Inventory form` => `Prime inventory form`
- *How do I send out the restock reminder?*
    You can send the email at any time by going to the Google Sheets menu, then selecting `G-WIT` => `Restock reminder` =>`Send restock reminder` or you can make it automatically send the email by setting the `Restock reminder interval` in the `settings` sheet, then going to the menu and selecting `G-WIT` => `Restock reminder` => `Prime restock reminder`
- *How do I make the application stop automatically sending emails?*
    Go to the `settings` sheet, delete the value in the `Inventory form interval` and `Restock reminder interval` cells, then go to the menu and select `G-WIT` => `Inventory form` => `Prime inventory form` as well as `G-WIT` => `Restock reminder` => `Prime restock reminder`
- *How do I check who submitted an update to the inventory?* You can view form responses by un-hiding the sheets for each form.

## Known issues

- Users with access to either the user form or the spreadsheet an add or modify
    the email notification preferences of other users, and so the system can be
    used to send unwanted emails to other users. As such, usage of this system
    assumes no bad actors are involved.
 
- *I just added an item to the inventory, but it isn't showing up in the inventory form.*
    The program only changes the inventory form whenever it sends it, so the new item will show up the next time it sends.

## Helpful Links

- [clasp](https://developers.google.com/apps-script/guides/clasp)
- [Google Script documentation](https://developers.google.com/apps-script/reference)