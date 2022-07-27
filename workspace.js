/**
 * This module is responsible for integrating with Google Workspace. By doing so
 * in a separate file from the bulk of the system, third-party dependencies are
 * isolated from the core system, allowing it to more easily port between 
 * implementations.
 */


class GoogleSheetsProductTypeRepository extends AbstractProductTypeRepository {

}


/**
 * Mutates the given workbook into a suitable environment for the application.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string|undefined} namespace - can specify for testing
 */
function setupWorkspace(workbook, namespace=""){
    const inventorySheetName = sheetNameFor("inventory", namespace);
    let inventorySheet = workbook.getSheetByName(inventorySheetName);
    if(null === inventorySheet){ // create if it doesn't exist yet
        inventorySheet = workbook.insertSheet(inventorySheetName);
        inventorySheet.setFrozenRows(1);
        const headers = ["name", "quantity", "minimum", "notification interval", 
            "last notified"];
        const firstRow = inventorySheet.getRange(1, 1, 1, headers.length); // 1-indexed
        firstRow.setValues([headers]); // one row, which is headers
    }
}


/**
 * Each workbook should support multiple namespaces for testing purposes, though
 * should also support a default, unspecified namespace
 * @param {string} sheetName 
 * @param {string|undefined} namespace 
 * @returns the name for the given sheet within the given namespace
 */
function sheetNameFor(sheetName, namespace=""){
    mustHaveValue(sheetName);
    mustHaveValue(namespace);

    return ("" === namespace) ? sheetName : `${namespace}-${sheetName}`;
}


function testWorkspaceModule(){
    const sheet = "foo";
    const namespace = "bar";
    
    const sheetWithoutNamespace = sheetNameFor(sheet);
    assert(sheetWithoutNamespace.includes(sheet));

    const sheetWithNamespace = sheetNameFor(sheet, namespace);
    assert(sheetWithNamespace.includes(sheet));
    assert(sheetWithNamespace.includes(namespace));
}