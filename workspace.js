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

        return this.convertRowToProductType(row);
    }

    convertRowToProductType(row){
        /*
        if the row was added via a call to addProductType with a ProductType
        where lastNotified === null, the value of the cell will be an empty 
        string, so this converts it back to null
        */
        const lastNotified = (row[4] === "") ? null : row[4];

        // validation handled in constructor
        const productType = new ProductType(
            row[0],
            row[1],
            row[2],
            row[3],
            lastNotified
        );

        return productType;
    }

    getAllProductTypes(){
        const allRows = this.sheet.getDataRange().getValues();
        allRows.shift(); // removes header row
        return allRows.map(this.convertRowToProductType);
    }
}


/**
 * Mutates the given workbook into a suitable environment for the application.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string|undefined} namespace - can specify for testing
 */
function setupWorkspace(workbook, namespace=""){
    deleteAllSheetsThatListenToForms(workbook, namespace); // temp hopefully
    setupInventorySheet(workbook, namespace);
    setupNewProductTypeForm(workbook, namespace);
}

function deleteAllSheetsThatListenToForms(workbook, namespace){
    workbook.getSheets().filter(sheet => {
        return sheet.getName().includes(namespace);
    }).filter(sheet => {
        return sheet.getFormUrl() !== null;
    }).forEach(sheet => {
        const formUrl = sheet.getFormUrl();
        const form = FormApp.openByUrl(formUrl);
        form.removeDestination();

        const file = DriveApp.getFileById(form.getId());
        file.setTrashed(true);

        workbook.deleteSheet(sheet);
    });
}

function setupInventorySheet(workbook, namespace){
    ifSheetDoesNotExist(workbook, sheetNameFor("inventory", namespace), name => {
        inventorySheet = workbook.insertSheet(name);
        inventorySheet.setFrozenRows(1);
        const headers = ["name", "quantity", "minimum", "notification interval", 
            "last notified"];
        const firstRow = inventorySheet.getRange(1, 1, 1, headers.length); // 1-indexed
        firstRow.setValues([headers]); // one row, which is headers
    });
}

/**
 * @param {SpreadsheetApp.Spreadsheet} workbook
 * @param {string} sheetName 
 * @param {void function(string)} doThis 
 */
function ifSheetDoesNotExist(workbook, sheetName, doThis){
    if(null === workbook.getSheetByName(sheetName)){
        doThis(sheetName);
    }
}

function setupNewProductTypeForm(workbook, namespace){
    ifSheetDoesNotExist(workbook, newProductTypeFormNameFor(namespace), name => {
        const newProductTypeForm = createNewProductTypeForm(workbook, namespace);
        newProductTypeForm.setDestination(
            FormApp.DestinationType.SPREADSHEET, 
            workbook.getId()
        );
        
        /*
        it looks like Form::setDestination runs asynchronously, yet cannot be
        awaited, so by the time this next section runs, the sheet is NOT 
        guaranteed to exist
        
        https://issuetracker.google.com/issues/36764101

        Apparently, this is a feature, not a bug
        */
        
        /*
        // rename the sheet created by setDestination so it's easier to find
        const formUrl = newProductTypeForm.getPublishedUrl();
        console.log(`Searching for sheet listening to ${newProductTypeForm.getPublishedUrl()}...`);
        const createdSheet = workbook.getSheets().find(sheet => {
            console.log(`${sheet.getName()} listens to ${sheet.getFormUrl()}`);
            return sheet.getFormUrl() === formUrl; // https://stackoverflow.com/a/51484165
        });
        createdSheet.setName(name);
        */
    });
}

function newProductTypeFormNameFor(namespace){
    let name = "Add a new product type to the inventory";
    if(namespace !== ""){
        name += " - " + namespace;
    }
    return name;
}

/**
 * Creates the form which the stock keeper will use to add new product types to
 * the inventory.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string|undefined} namespace - can specify for testing
 * @return {FormApp.Form} the created form
 */
function createNewProductTypeForm(workbook, namespace=""){
    /*
    Google Forms does not support number input fields, but uses text fields with
    number validators instead. There are two important points to consider when
    handling the submitted form:
    1. some fields can be empty
    2. numerical fields must be explicitely converted from strings
    */
    const mustBeANonNegativeNumber = FormApp.createTextValidation()
        .setHelpText("Must be a non-negative number.")
        .requireNumberGreaterThanOrEqualTo(0)
        .build();
    const mustBeAPositiveNumber = FormApp.createTextValidation()
        .setHelpText("Must be a positive number.")
        .requireNumberGreaterThan(0)
        .build();
    
    const formName = newProductTypeFormNameFor(namespace);
    const form = FormApp.create(formName);
    form.setTitle(formName); // not set by create
    form.setDescription("Add a new product type to the inventory.");

    form.addTextItem()
        .setTitle("Product name")
        .setRequired(true);

    form.addTextItem()
        .setTitle("How many are in stock now?")
        .setValidation(mustBeANonNegativeNumber);
    
    form.addTextItem()
        .setTitle("How many do you want to keep in stock at all times?")
        .setValidation(mustBeANonNegativeNumber);
    
    form.addTextItem()
        .setTitle("How many days should there be between each time I ask you to check this product's stock?")
        .setValidation(mustBeAPositiveNumber);

    return form;
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

    const all = sut.getAllProductTypes();
    assert(1 === all.length, `length should be 1, not ${all.length}`);
    assert(expected.dataEquals(all[0]));

    /*
    only remove test sheets if tests are successful, as this allows us to
    diagnose errors if one of these tests fails
    */
    removeTestSheetsFrom(workbook);
    deleteAllSheetsThatListenToForms(workbook, "test");
}

function removeTestSheetsFrom(workbook){
    // expand once we have more test sheets
    const inventorySheet = workbook.getSheetByName(sheetNameFor("inventory", "test"));
    if(inventorySheet !== null){
        workbook.deleteSheet(inventorySheet);
    }
}