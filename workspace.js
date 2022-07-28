/**
 * This module is responsible for integrating with Google Workspace. By doing so
 * in a separate file from the bulk of the system, third-party dependencies are
 * isolated from the core system, allowing it to more easily port between 
 * implementations.
 */


class GoogleSheetsProductTypeRepository extends AbstractProductTypeRepository {
    /**
     * @param {SpreadsheetApp.Sheet} sheet the "inventory" sheet of a workbook
     */
    constructor(sheet){
        super();
        this.sheet = sheet;
    }

    addProductType(productType){
        this.sheet.appendRow([
            productType.name,
            productType.quantity,
            productType.minimum,
            productType.notificationInterval,
            productType.lastNotified
        ]);
    }

    hasProductTypeWithName(name){
        const namesInSheet = this.sheet.getRange("A2:A").getValues().map((row)=>{
            /*
            getValues() returns Object[][], so the row argument here is Object[]
            */
            return row[0]; // flattens
        }).map(normalizeProductTypeName); 
        // normalizeProductTypeNames defined in product.js

        return namesInSheet.includes(normalizeProductTypeName(name));
    }

    getProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No product type with name "${name}"`);
        }
        name = normalizeProductTypeName(name);
        const allRows = this.sheet.getDataRange().getValues();
        let row = null;
        let found = false;
        /*
        using primitive for loop so it can break out of processing once it finds
        a match instead of processing the rest of the sheet
        */
        // start at i = 1, as allRows[0] is the header row
        for(let i = 1; !found && i < allRows.length; ++i){
            row = allRows[i];
            if(normalizeProductTypeName(row[0]) === name){
                found = true;
            }
        }

        if(!found){
            /*
            if it goes here, there is likely a problem with hasProductTypeWithName
            */
            throw new Error("code should not have gotten here");
        }

        throw new Error("todo: parse row, ensure no NaNs, return DTO");
    }
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



/*
Unit tests
*/

function testWorkspaceModule(){
    testSheetNameFor();
    testGoogleSheetsProductTypeRepository();    
}

function testSheetNameFor(){
    const sheetName = "foo";
    const namespace = "bar";
    
    const sheetWithoutNamespace = sheetNameFor(sheetName);
    assert(sheetWithoutNamespace.includes(sheetName));

    const sheetWithNamespace = sheetNameFor(sheetName, namespace);
    assert(sheetWithNamespace.includes(sheetName));
    assert(sheetWithNamespace.includes(namespace));
}

function testGoogleSheetsProductTypeRepository(){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    removeTestSheetsFrom(workbook);
    setupWorkspace(workbook, "test");

    const sheet = workbook.getSheetByName(sheetNameFor("inventory", "test"));
    const sut = new GoogleSheetsProductTypeRepository(sheet)
    const expected = new ProductType("product");

    sut.addProductType(expected);
    assert(sut.hasProductTypeWithName(expected.name));
    assert(!sut.hasProductTypeWithName("not " + expected.name));

    const actual = sut.getProductTypeByName(expected.name);
    assert(expected.dataEquals(actual));

    /*
    only remove test sheets if tests are successful, as this allows us to
    diagnose errors if one of these tests fails
    */
    removeTestSheetsFrom(workbook);
}

function removeTestSheetsFrom(workbook){
    // expand once we have more test sheets
    const inventorySheet = workbook.getSheetByName(sheetNameFor("inventory", "test"));
    if(inventorySheet !== null){
        workbook.deleteSheet(inventorySheet);
    }
}