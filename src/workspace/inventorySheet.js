/**
 * This module is responsible for the inventory sheet created by the application
 * in its host Google Spreadsheet.
 */



function inventorySheetModule(workspace=null){
    workspace = Workspace.currentOr(workspace);
    return new Component(
        workspace, 
        _inventorySheetNameFor,
        ()=>_setupInventorySheet(workspace) // not just _setupInventorySheet
    );
}

function _inventorySheetNameFor(namespace){
    return nameFor("inventory", namespace);
}

function _setupInventorySheet(workspace){
    const name = _inventorySheetNameFor(workspace.namespace);
    const inventorySheet = workspace.workbook.insertSheet(name);
    inventorySheet.setFrozenRows(1);

    const validation = SpreadsheetApp.newDataValidation()
        .requireNumberGreaterThanOrEqualTo(0)
        .setAllowInvalid(false)
        .setHelpText("Quantity and minimum must both be a number at least 0")
        .build();
    const quantityAndMinimumColumns = inventorySheet.getRange("B2:C");
    quantityAndMinimumColumns.setDataValidation(validation);

    const headers = ["name", "quantity", "minimum"];
    inventorySheet.appendRow(headers);
}

/**
 * @param {Workspace|undefined} workspace
 * @returns {ItemService} an instance of ItemService backed by a Google sheet as 
 *  its repository
 */
function createItemService(workspace=null){
    workspace = Workspace.currentOr(workspace);
    const name = _inventorySheetNameFor(workspace.namespace);
    const sheet = workspace.workbook.getSheetByName(name);
    const repo = makeGoogleSheetsItemRepository(sheet);
    const emails = createEmailService(workspace);
    const service = new ItemService(repo, emails);
    return service;
}

function makeGoogleSheetsItemRepository(sheet){
    return new GoogleSheetsRepository(
        sheet,
        (item)=>item.name,
        (item)=>[item.name, item.quantity, item.minimum],
        (row)=>new Item(
            row[0], 
            (row[1] === "") ? undefined : row[1], // catch empty cells
            (row[2] === "") ? undefined : row[2]
        )
    );
}



function testGoogleSheetsItemRepository(workbook){
    const sheet = workbook.getSheetByName(_inventorySheetNameFor("test"));
    const sut = makeGoogleSheetsItemRepository(sheet)
    const expected = new Item("item");

    sut.addEntity(expected);
    assert(sut.hasEntityWithKey(expected.name));
    assert(!sut.hasEntityWithKey("not " + expected.name));

    const actual = sut.getEntityByKey(expected.name);
    assert(expected.dataEquals(actual));

    const all = sut.getAllEntities();
    assert(1 === all.length, `length should be 1, not ${all.length}`);
    assert(expected.dataEquals(all[0]));
}