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
		.addItem("Regenerate stock update form", "regenerateStockUpdateForm")
		.addItem("Send stock update form", "sendStockUpdateForm")
		.addItem("Run unit tests (fast)", "unitTests")
		.addItem("Run integration tests (slow)", "integrationTests")
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
	deleteWorkspace(workbook);
	setup();
}

/**
 * this might be temporary
 */
function regenerateStockUpdateForm(){
	regenerateStockUpdateFormFor(SpreadsheetApp.getActiveSpreadsheet());
}

/**
 * this might be temporary
 */
function sendStockUpdateForm(){
	createEmailService().sendStockUpdateForm();
}


function unitTests(){
	testProductTypeModule();
	testSettings();
	testUserModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}


function integrationTests(){
	testWorkspaceModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}