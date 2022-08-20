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
 * @returns {ProductTypeService} an instance of ProductTypeService backed by a Google sheet as its
 *  repository
 */
function createProductService(namespace=""){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = workbook.getSheetByName(_inventorySheetNameFor(namespace));
    const repo = makeGoogleSheetsProductTypeRepository(sheet);
    const service = new ProductTypeService(repo);
    return service;
}

function makeGoogleSheetsProductTypeRepository(sheet){
    return new GoogleSheetsRepository(
        sheet,
        (productType)=>productType.name,
        (productType)=>[productType.name, productType.quantity, productType.minimum],
        (row)=>new ProductType(
            row[0], 
            (row[1] === "") ? undefined : row[1], // catch empty cells
            (row[2] === "") ? undefined : row[2]
        )
    );
}



function testGoogleSheetsProductTypeRepository(workbook){
    const sheet = workbook.getSheetByName(_inventorySheetNameFor("test"));
    const sut = makeGoogleSheetsProductTypeRepository(sheet)
    const expected = new ProductType("product");

    sut.addEntity(expected);
    assert(sut.hasEntityWithKey(expected.name));
    assert(!sut.hasEntityWithKey("not " + expected.name));

    const actual = sut.getEntityByKey(expected.name);
    assert(expected.dataEquals(actual));

    const all = sut.getAllEntities();
    assert(1 === all.length, `length should be 1, not ${all.length}`);
    assert(expected.dataEquals(all[0]));
}