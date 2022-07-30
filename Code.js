/**
 * this module is responsible for loading interacting with the Google Sheets UI
 */


/**
 * called automatically upon opening the Google Spreadsheet
 */
function onOpen(){
	const ui = SpreadsheetApp.getUi();
	ui.createMenu("G-WIT")
		.addItem("Set up", "setup")
		.addItem("Reset workspace", "resetWorkspace")
		.addItem("Test", "test")
		.addToUi();
}

/**
 * mutates the current Google Sheet into a suitable environment for the program
 */
function setup(){
	const workbook = SpreadsheetApp.getActiveSpreadsheet();
	setupWorkspace(workbook);
	SpreadsheetApp.getUi().alert("Setup complete!");
}

/**
 * a testing function that removes all the auto-generated Google Workspace stuff
 */
function resetWorkspace(){
	const workbook = SpreadsheetApp.getActiveSpreadsheet();
	deleteWorkspace(workbook, "");
	setup();
}

/**
 * runs all tests
 */
function test(){
	testProductTypeModule();
	testWorkspaceModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}