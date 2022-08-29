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
		.addItem("Regenerate inventory form", "regenerateInventoryForm")
		.addItem("Send inventory form", sendInventoryForm.name)
		.addItem("Prime inventory form", primeInventoryForm.name)
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
function regenerateInventoryForm(){
	regenerateInventoryFormFor(SpreadsheetApp.getActiveSpreadsheet());
}

function unitTests(){
	testItemModule();
	testSettings();
	testUserModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}


function integrationTests(){
	testWorkspaceModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}