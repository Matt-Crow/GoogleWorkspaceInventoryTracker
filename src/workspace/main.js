/**
 * this module is responsible for loading interacting with the Google Sheets UI
 */

/**
 * called automatically upon opening the Google Spreadsheet
 */
function onOpen(){
	const ui = SpreadsheetApp.getUi();
	ui.createMenu("G-WIT")
		.addItem("Set up", setup.name)
		.addItem("Reset workspace", resetWorkspace.name)
		.addItem("Regenerate remove item form", regenerateRemoveItemFormFor.name)
		.addSubMenu(ui.createMenu("Inventory form")
			.addItem("Prime inventory form", primeInventoryForm.name)
			.addItem("Send inventory form", sendInventoryForm.name)
			.addItem("Regenerate inventory form", regenerateInventoryFormFor.name)
		)
		.addSubMenu(ui.createMenu("Restock reminder")
			.addItem("Prime restock reminder", primeRestockReminder.name)
			.addItem("Send restock reminder", sendRestockReminder.name)
		)
		.addSubMenu(ui.createMenu("Tests")
			.addItem("Run unit tests (fast)", unitTests.name)
			.addItem("Run integration tests (slow)", integrationTests.name)
		)
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
 * Removes all the auto-generated sheets & triggers used by this app.
 */
function resetWorkspace(){
	const workbook = SpreadsheetApp.getActiveSpreadsheet();
	deleteWorkspace(workbook);
	setup();
}

/**
 * Schedules the inventory form to be sent automatically according to the
 * interval in the settings sheet.
 */
function primeInventoryForm(){
	const reminder = createReminderService().scheduleInventoryForm();
    const msg = (reminder.wasCreated)
		? `The inventory form will now be sent every ${reminder.interval} days.`
		: "The inventory form will no longer be automatically sent.";
	SpreadsheetApp.getUi().alert(msg);
}

/**
 * Sends a form to all registered stock keepers, asking them to update the
 * quantity of each item in the inventory.
 */
function sendInventoryForm(){
    createEmailService().sendInventoryForm();
}

/**
 * Schedules the restock reminder to be sent automatically according to the
 * interval in the settings sheet.
 */
function primeRestockReminder() {
	const reminder = createReminderService().scheduleRestockReminder();
	const msg = (reminder.wasCreated)
		? `The restock reminder will now be sent every ${reminder.interval} days.`
		: "The restock reminder will no longer be automatically sent.";
	SpreadsheetApp.getUi().alert(msg);
}

/**
 * Sends an email to all registered restockers, notifying them of which items
 * in the inventory need to be restocked.
 */
function sendRestockReminder(){
    const lowOnStock = createItemService().getItemsToRestock();
    createEmailService().sendRestockReminder(lowOnStock);
}

/**
 * Runs all of the application's unit tests.
 */
function unitTests(){
	testItemModule();
	testSettings();
	testUserModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}

/**
 * Runs all of the application's integration tests.
 */
function integrationTests(){
	testWorkspaceModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}