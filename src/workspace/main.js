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
		.addItem("Regenerate inventory form", regenerateInventoryForm.name)
		.addItem("Regenerate remove item form", regenerateRemoveItemFormFor.name)
		.addItem("Send inventory form", sendInventoryForm.name)
		.addItem("Prime inventory form", primeInventoryForm.name)
		.addSubMenu(ui.createMenu("Restock reminder")
			.addItem("Send restock reminder", sendRestockReminder.name)
		)
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

function regenerateInventoryForm(){
	regenerateInventoryFormFor(SpreadsheetApp.getActiveSpreadsheet());
}


function sendInventoryForm(){
    createEmailService().sendInventoryForm();
}


function primeInventoryForm(){
    const msg = createEmailService().updateTrigger();
    SpreadsheetApp.getUi().alert(msg);
}


function sendRestockReminder(){
    const lowOnStock = createItemService().getItemsToRestock();
    createEmailService().sendRestockReminder(lowOnStock);
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