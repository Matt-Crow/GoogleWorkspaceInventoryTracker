/**
 * This module is responsible for the inventory sheet created by the application
 * in its host Google Spreadsheet.
 */



 function inventorySheetModule(workbook, namespace){
    return new Component(
        workbook, 
        namespace, 
        _inventorySheetNameFor,
        (ns)=>_setupInventorySheet(workbook, ns)
    );
}

function _inventorySheetNameFor(namespace){
    return nameFor("inventory", namespace);
}

function _setupInventorySheet(workbook, namespace){
    const inventorySheet = workbook.insertSheet(_inventorySheetNameFor(namespace));
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
 * @param {string|undefined} namespace
 * @returns {ItemService} an instance of ItemService backed by a Google sheet as its
 *  repository
 */
function createItemService(namespace=""){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = workbook.getSheetByName(_inventorySheetNameFor(namespace));
    const repo = makeGoogleSheetsItemRepository(sheet);
    const service = new ItemService(repo);
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