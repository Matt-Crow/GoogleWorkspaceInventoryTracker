/**
 * this module is responsible for loading interacting with the Google Sheets UI
 */


/**
 * called automatically upon opening the Google Spreadsheet
 */
function onOpen(){
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("G-WIT")
    .addItem("Test", "test")
    .addToUi();
}

/**
 * runs all tests
 */
function test(){
  testProductTypeModule();
  SpreadsheetApp.getUi().alert("All tests passed successfully!");
}