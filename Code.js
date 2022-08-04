// This file has been generated by catgs.py

// glob of product
/**
 * This module is responsible for services related to ProductTypes
 * 
 * Data class: ProductType
 * #----------------------#--------#
 * |                 name | string |
 * |             quantity | int    |
 * |              minimum | int    |
 * | notificationInterval | int    |
 * |         lastNotified | Date?  |
 * #----------------------#--------#
 */



const DEFAULT_NOTIFICATION_INTERVAL = 7; // measured in days



/**
 * the ProductType class represents a type of product that can be tracked by the
 * system and the various tracking parameters associated with the product
 */
class ProductType {
    /**
     * @param {string} name - an identifier for this type of product
     * @param {number} quantity - the amount of this product currently in stock 
     * @param {number} minimum - the system will report when quantity <= minimum
     * @param {number} notificationInterval - how often the stock keeper should
     *  be asked to update the quantity of this product type (measured in days)
     * @param {Date} lastNotified - the last time quantity was updated 
     */
    constructor(name, quantity=0, minimum=0, notificationInterval=DEFAULT_NOTIFICATION_INTERVAL, lastNotified=null){
        mustHaveValue(name);
        mustHaveValue(quantity);
        mustBeNonNegative(quantity);
        mustHaveValue(minimum);
        mustBeNonNegative(minimum);
        mustHaveValue(notificationInterval);
        mustBePositive(notificationInterval);

        this.name = normalizeProductTypeName(name);
        this.quantity = quantity;
        this.minimum = minimum;
        this.notificationInterval = notificationInterval;
        this.lastNotified = lastNotified;
    }

    dataEquals(other){
        return this.name === other.name &&
            this.quantity === other.quantity &&
            this.minimum === other.minimum &&
            this.notificationInterval === other.notificationInterval &&
            this.lastNotified === other.lastNotified;
    }

    copy(){
        return new ProductType(
            this.name, 
            this.quantity, 
            this.minimum, 
            this.notificationInterval, 
            this.lastNotified
        );
    }
}



/**
 * provides the interface for CRUD operations on ProductTypes
 * 
 * because of how Google script concatinates files together, class extension
 * does not work, so this class does nothing but provide developer guidelines
 */
class AbstractProductTypeRepository {
    /**
     * records a new ProductType in the repository
     * subclasses are responsible for deciding how to handle adding a 
     * ProductType whose name is already used
     * 
     * @param {ProductType} productType 
     */
    addProductType(productType){
        throw new Error("addProductType is not implemented");
    }

    /**
     * @param {string} name
     * @returns {boolean} whether this repository has a ProductType with the
     *  given name 
     */
    hasProductTypeWithName(name){
        throw new Error("hasProductTypeWithName is not implemented");
    }

    /**
     * retrieves the ProductType whose name matches the given name
     * subclasses are responsible for deciding how to handle getting a name for
     * which the exists no product
     * 
     * @param {string} name 
     * @returns {ProductType}
     */
    getProductTypeByName(name){
        throw new Error("getProductTypeByName is not implemented");
    }

    /**
     * @returns {ProductType[]}
     */
    getAllProductTypes(){
        throw new Error("getAllProductTypes is not implemented");
    }

    /**
     * Changes the ProductType in this repository whose name matches that of the
     * given parameter so that its data matches that of the parameter.
     * Subclasses are responsible for how to handle updating a ProductType that
     * does not exist in the repository.
     * 
     * @param {ProductType} productType 
     */
    updateProductType(productType){
        throw new Error("updateProductType is not implemented");
    }

    /**
     * Removed the ProductType with the given name from the repository.
     * Subclasses are responsible for how to handle deleting a name for which
     * there exists no ProductType.
     * 
     * @param {string} name 
     */
    deleteProductTypeByName(name){
        throw new Error("deleteProductTypeByName is not implemented");
    }

    deleteAll(){
        throw new Error("deleteAll is not implemented");
    }

    save(){
        throw new Error("save is not implemented");
    }
}

/**
 * ProductTypes are considered equal if their names are the same, ignoring case
 * 
 * @param {string} name 
 * @returns the normalized product type name
 */
function normalizeProductTypeName(name){
    return name.toLowerCase();
}

/**
 * This non-persistant ProductType repository can be used for testing or as a
 * cache for GoogleSheetsProductTypeRepository
 */
class InMemoryProductTypeRepository extends AbstractProductTypeRepository {
    constructor(products=[]){
        super();
        this.products = new Map();
        products.forEach(product => this.products.set(
            normalizeProductTypeName(product.name),
            product
        ));
    }

    addProductType(productType){
        const name = normalizeProductTypeName(productType.name);
        if(this.hasProductTypeWithName(name)){
            throw new Error(`Product already exists with name "${name}"`);
        }
        this.products.set(name, productType.copy());
    }

    hasProductTypeWithName(name){
        return this.products.has(normalizeProductTypeName(name));
    }

    getProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No product type with name "${name}"`);
        }
        return this.products.get(normalizeProductTypeName(name)).copy();
    }

    getAllProductTypes(){
        return Array.from(this.products.values()).map(pt => pt.copy());
    }

    updateProductType(productType){
        const name = normalizeProductTypeName(productType.name);
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`Cannot update product type with name "${name}", as no product with that name exists`);
        }
        this.deleteProductTypeByName(name);
        this.addProductType(productType);
    }

    deleteProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`Cannot delete product type with name "${name}", as no product with that name exists`);
        }
        this.products.delete(normalizeProductTypeName(name));
    }

    deleteAll(){
        this.products.clear();
    }

    save(){

    }
}


/**
 * The ProductTypeService handles ProductTypes business logic
 */
class ProductTypeService {
    /**
     * @param {AbstractProductTypeRepository} repository 
     */
    constructor(repository){
        this.repository = repository;
    }

    /**
     * @returns {ProductType[]}
     */
    getAllProductTypes(){
        return this.repository.getAllProductTypes();
    }

    /**
     * @param {ProductType} product 
     */
    handleNewProduct(product){
        if(this.repository.hasProductTypeWithName(product.name)){
            console.error(`Duplicate product name received from new product form: ${product.name}`);
        } else {
            this.repository.addProductType(product);
        }
    }

    /**
     * @param {ProductType[]} products 
     */
    handleLogForm(products){
        products.forEach(product => {
            const n = normalizeProductTypeName(product.name);
            if(this.repository.hasProductTypeWithName(n)){
                this.repository.updateProductType(product);
            } else {
                this.repository.addProductType(product);
            }
        });
        this.repository.save();
    }
}


/**
 * runs all unit tests for this module, throwing an exception if any fail
 */
function testProductTypeModule(){
    testProductType();
    testInMemoryProductTypeRepository();
    testProductTypeService();
}

function testProductType(){
    // any defined name is OK
    const name = "foo";
    new ProductType(name);
    assertThrows(()=>new ProductType(undefined));
    assertThrows(()=>new ProductType(null));
    
    // amount must be defined and non-negative
    const amount = 5;
    new ProductType(name, amount);
    new ProductType(name, 0);
    assertThrows(()=>new ProductType(name, null));
    assertThrows(()=>new ProductType(name, -amount));

    // minimum must be defined and non-negative
    const minimum = 3;
    new ProductType(name, amount, minimum);
    new ProductType(name, amount, 0);
    assertThrows(()=>new ProductType(name, amount, null));
    assertThrows(()=>new ProductType(name, amount, -minimum));

    // notificationInterval must be defined and positive
    const notificationInterval = 3;
    new ProductType(name, amount, minimum, notificationInterval);
    assertThrows(()=>new ProductType(name, amount, minimum, 0));
    assertThrows(()=>new ProductType(name, amount, minimum, -notificationInterval));

    // no constraints of lastNotified
}

function testInMemoryProductTypeRepository(){
    const data = new ProductType("foo");
    const productTypeComparator = (a, b) => a.dataEquals(b);

    let sut = new InMemoryProductTypeRepository();
    sut.addProductType(data);
    assertContains(data, sut.products.values(), productTypeComparator);

    sut = new InMemoryProductTypeRepository([data]);
    let actual = sut.getProductTypeByName(data.name);
    assert(data.dataEquals(actual));

    const values = ["foo", "bar", "baz"].map(n => new ProductType(n)); 
    sut = new InMemoryProductTypeRepository(values);
    actual = sut.getAllProductTypes();
    assert(3 === actual.length);
    assertContains(values[0], actual, productTypeComparator);
    assertContains(values[1], actual, productTypeComparator);
    assertContains(values[2], actual, productTypeComparator);

    sut = new InMemoryProductTypeRepository([data]);
    let changed = data.copy();
    changed.quantity += 1;
    sut.updateProductType(changed);
    actual = sut.getProductTypeByName(data.name);
    assert(changed.dataEquals(actual));
    assert(!data.dataEquals(actual));
}

function testProductTypeService(){
    const productTypeComparator = (a, b) => a.dataEquals(b);
    const exists = new ProductType("foo");
    const notYetAdded = new ProductType("bar");
    const repo = new InMemoryProductTypeRepository([exists]);
    const sut = new ProductTypeService(repo);
    const expected = [
        exists.copy(),
        notYetAdded
    ];
    expected[0].quantity += 1;

    sut.handleLogForm(expected);
    const actual = repo.getAllProductTypes();

    assert(expected.length === actual.length);
    assertContains(expected[0], actual, productTypeComparator);
    assertContains(expected[1], actual, productTypeComparator);
    assertDoesNotContain(exists, actual);
}
// glob of utilities
/**
 * This module contains miscillaneous utilities.
 * 
 * void assert(boolean, string?)
 * void assertThrows(void function())
 * void assertContains(T, T[], boolean function(T, T))
 * void assertDoesNotContain(T, T[], boolean function(T, T))
 * 
 * void mustBeNonNegative(number)
 * void mustBeNumber(obj)
 * void mustBePositive(number)
 * 
 * void mustBeDefined(*)
 * void mustHaveValue(*)
 */

function assert(bool, msg=""){
    if(!bool){
        throw new Error(msg);
    }
}

function assertThrows(fn){
    let anExceptionWasThrown = false;
    try {
        fn();
    } catch(ex){
        anExceptionWasThrown = true;
    }
    if(!anExceptionWasThrown){
        throw new Error("Function failed to throw an error");
    }
}

function assertContains(item, collection, comparator=(a, b)=>a===b){
    if(!Array.from(collection).some((curr)=>comparator(curr, item))){
        throw new Error(`${collection} does not contain ${item}`);
    }
}

function assertDoesNotContain(item, collection, comparator=(a, b)=>a===b){
    if(Array.from(collection).some((curr)=>comparator(curr, item))){
        throw new Error(`${collection} does contains ${item}`);
    }
}


function mustBePositive(num){
    mustBeNumber(num);
    if(num <= 0){
        throw new Error(`Value must be positive: ${num}`);
    }
}

function mustBeNumber(obj){
    const rightType = typeof(obj) === typeof(1);
    const isNum = rightType && !isNaN(obj);
    if(!isNum){
        throw new Error(`Value must be a number: ${obj}`);
    }
}

function mustBeNonNegative(num){
    mustBeNumber(num);
    if(num < 0){
        throw new Error(`Value must be non-negative: ${num}`);
    }
}


function mustBeDefined(obj){
    if(undefined === obj){
        throw new Error("Value cannot be undefined");
    }
}

function mustHaveValue(obj){
    mustBeDefined(obj)
    if(null === obj){
        throw new Error("Value cannot be null");
    }
}
// glob of inventorySheet
/**
 * This module is responsible for the inventory sheet created by the application
 * in its host Google Spreadsheet.
 */


class GoogleSheetsProductTypeRepository {
    /**
     * @param {SpreadsheetApp.Sheet} sheet the "inventory" sheet of a workbook
     */
    constructor(sheet){
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
        return namesInSheet.includes(normalizeProductTypeName(name));
    }

    getProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No product type with name "${name}"`);
        }

        name = normalizeProductTypeName(name);
        const allRows = this.sheet.getDataRange().getValues();
        allRows.shift(); // remove header
        
        const idx = allRows.findIndex(row => normalizeProductTypeName(row[0]) === name);

        if(-1 === idx){
            throw new Error("code should not have gotten here");
        }

        return this.convertRowToProductType(allRows[idx]);
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

    updateProductType(productType){
        let data = this.sheet.getDataRange().getValues();
        data.shift(); // remove headers
        
        const idx = data.findIndex(row => normalizeProductTypeName(row[0]) === productType.name);

        if(-1 === idx){
            throw new Error(`Failed to updated ProductType with name "${productType.name}"`);
        }

        let newRow = [
            productType.name, 
            productType.quantity,
            productType.minimum,
            productType.notificationInterval,
            new Date()
        ];
        //                        translate from 0-idx to 1-idx, +1 for header
        this.sheet.getRange(idx + 2, 1, 1, newRow.length).setValues([newRow]);
    }

    deleteProductTypeByName(name){
        name = normalizeProductTypeName(name);
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No ProductType exists with name "${name}"`);
        }

        let data = this.sheet.getDataRange().getValues();
        data.shift();

        const rowNum = data.findIndex(row => row[0] === name);

        if(rowNum === -1){
            throw new Error(`something went wrong in GoogleSheetsProductTypeRepository::deleteProductTypeByName("${name}")`);
        }

        this.sheet.deleteRow(rowNum + 2); // rowNum is 0-idx, deleteRow is 1-idx, +1 for header
    }

    deleteAll(){
        const lastRow = this.sheet.getLastRow();
        this.sheet.deleteRows(
            2, // skip header
            lastRow - 1 // has (lastRow) rows, so delete all but the first
        );
    }

    save(){
        
    }
}

function setupInventorySheet(workbook, namespace){
    ifSheetDoesNotExist(workbook, nameFor("inventory", namespace), name => {
        inventorySheet = workbook.insertSheet(name);
        inventorySheet.setFrozenRows(1);
        const headers = ["name", "quantity", "minimum", "notification interval", 
            "last notified"];
        const firstRow = inventorySheet.getRange(1, 1, 1, headers.length); // 1-indexed
        firstRow.setValues([headers]); // one row, which is headers
    });
}



function testGoogleSheetsProductTypeRepository(){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    deleteWorkspace(workbook, "test");
    setupWorkspace(workbook, "test");

    const sheet = workbook.getSheetByName(nameFor("inventory", "test"));
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
    deleteWorkspace(workbook, "test");
}
// glob of main
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
		.addItem("Test", "test")
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
 * runs all tests
 */
function test(){
	testProductTypeModule();
	testWorkspaceModule();
	SpreadsheetApp.getUi().alert("All tests passed successfully!");
}
// glob of newProductTypeForm
/**
 * This module is responsible for the Google Form used to add new product types
 * to the inventory.
 */

function newProductTypeFormNameFor(namespace=""){
    return nameFor("New Product Type", namespace);
}

function onNewProductTypeFormSubmit(event){
    console.log(JSON.stringify(event));
    const row = event.values;
    row.shift(); // remove first cell (timestamp)
    
    const name = row[0];
    const quantity = parseInt(row[1]);
    const minimum = parseInt(row[2]);
    const notificationInterval = parseInt(row[3]);

    const product = new ProductType(
        name,
        (isNaN(quantity)) ? undefined : quantity,
        (isNaN(minimum)) ? undefined : minimum,
        (isNaN(notificationInterval)) ? undefined : notificationInterval
    );
    console.log(JSON.stringify(product));

    const repo = new GoogleSheetsProductTypeRepository(
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameFor("inventory"))
    );
    const service = new ProductTypeService(repo);
    service.handleNewProduct(product);
}

/**
 * Creates the form which the stock keeper will use to add new product types to
 * the inventory.
 * @param {string} namespace
 * @return {FormApp.Form} the created form
 */
 function createNewProductTypeForm(namespace){
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
    
    const form = FormApp.create(newProductTypeFormNameFor(namespace));
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
// glob of stockUpdateForm
/**
 * This module is responsible for the Google Form used to update the quantity of
 * each product currently in the inventory.
 */

function stockUpdateFormNameFor(namespace=""){
    return nameFor("Stock Update", namespace);
}

function onStockUpdateFormSubmit(e){
    /*
    e.namedValues is formatted as
    {
        foo: ["answer to foo"],
        bar: ["answer to bar"]
    }
    */
    const fields = [];
    for(let [k, v] of Object.entries(e.namedValues)){
        fields.push({name: k, quantity: parseInt(v[0])});
    }
    
    console.log(JSON.stringify(fields));

    const products = fields.filter(answerToQuestion => {
        return !isNaN(answerToQuestion.quantity);
    }).filter(answerToQuestion => {
        return "Timestamp" !== answerToQuestion.name;
    }).map(answerToQuestion =>{
        return new ProductType(answerToQuestion.name, answerToQuestion.quantity);
    });

    console.log(JSON.stringify(products));

    const repo = new GoogleSheetsProductTypeRepository(
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nameFor("inventory"))
    );
    const service = new ProductTypeService(repo);
    service.handleLogForm(products);
}


function createNewStockUpdateForm(namespace=""){
    const mustBeANonNegativeNumber = FormApp.createTextValidation()
        .setHelpText("Must be a non-negative number.")
        .requireNumberGreaterThanOrEqualTo(0)
        .build();
    
    const form = FormApp.create(stockUpdateFormNameFor(namespace));
    form.setDescription("Update the inventory stock.");

    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = workbook.getSheetByName(nameFor("inventory", namespace));
    const repo = new GoogleSheetsProductTypeRepository(sheet);
    const service = new ProductTypeService(repo);

    const productNames = service.getAllProductTypes().map(pt => pt.name);

    productNames.forEach(productName => {
        form.addTextItem()
            .setTitle(productName)
            .setRequired(false)
            .setValidation(mustBeANonNegativeNumber);
    });

    return form;
}

// this will need to be called before sending the form if a new product type has been submitted
// probably use an "isStale" flag
function regenerateStockUpdateFormFor(workbook, namespace=""){
    deleteSheet(workbook, stockUpdateFormNameFor(namespace));
    setupStockUpdateFormFor(workbook, namespace);
}
// glob of workspace
/**
 * This module is responsible for integrating with Google Workspace. By doing so
 * in a separate file from the bulk of the system, third-party dependencies are
 * isolated from the core system, allowing it to more easily port between 
 * implementations.
 */



const FORM_HANDLER_NAME = onFormSubmit.name;



/*
this does not automatically start handling forms, and is explicitly registered
in setupFormHandler
*/
function onFormSubmit(e){
    /*
    ugly duck-typing, but it looks like e doesn't have any other way of knowing
    which form submitted it
    */
    if("Product name" in e.namedValues){
        onNewProductTypeFormSubmit(e);
    } else {
        onStockUpdateFormSubmit(e);
    }    
}


/*
Using this to get around the Google script inheritance issue caused by 
unpredictable script execution order.
*/
class FormHelper {
    /**
     * 
     * @param {SpreadsheetApp.Spreadsheet} workbook 
     * @param {string} namespace 
     * @param {(string)=>string} namespaceToName
     * @param {FormApp.Form function(string)} create
     */
    constructor(workbook, namespace, namespaceToName, create){
        this.workbook = workbook;
        this.namespace = namespace;
        this.name = namespaceToName(namespace);
        this.create = create;
    }

    setup(){
        const sheet = this.workbook.getSheetByName(this.name);
        if(null === sheet){
            this._doSetup();
        }
    }

    _doSetup(){
        const form = this.create(this.namespace); // not this.name
        form.setDestination(
            FormApp.DestinationType.SPREADSHEET, 
            this.workbook.getId()
        );

        /*
        The form is created using the Google Forms service instead of the Sheets
        service, so the call to setDestination does not alter workbook. Sheets
        caches the contents of the spreadsheet when it is accessed using
        SpreadsheetApp, and the contents are only updated when a writing 
        function is used. Since getSheets is a reading call, it reads the cached
        list of sheets, which excludes the newly created destination sheet.
        
        https://issuetracker.google.com/issues/36764101
        */
        SpreadsheetApp.flush(); // updates the workbook variable
        
        // rename the sheet created by setDestination so it's easier to find
        // this URL solution doesn't work: https://stackoverflow.com/a/51484165
        const formId = form.getId();
        const createdSheet = this.workbook.getSheets().filter(sheet => {
            return null !== sheet.getFormUrl();
        }).find(sheet => {
            const form = FormApp.openByUrl(sheet.getFormUrl());
            return form.getId() === formId; 
        });
        createdSheet.setName(this.name);
    }

    deleteForm(){
        deleteSheet(this.workbook, this.name);
    }
}


/**
 * Mutates the given workbook into a suitable environment for the application.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string|undefined} namespace - can specify for testing
 */
function setupWorkspace(workbook, namespace=""){
    setupInventorySheet(workbook, namespace);

    const newProductTypeFormHelper = new FormHelper(
        workbook,
        namespace,
        newProductTypeFormNameFor,
        createNewProductTypeForm
    );
    newProductTypeFormHelper.setup();

    setupStockUpdateFormFor(workbook, namespace);

    setupFormHandler(workbook);
}

/*
Since this is needed by regenerateStockUpdateFormFor, moved to this function 
 */
function setupStockUpdateFormFor(workbook, namespace=""){
    const stockUpdateFormHelper = new FormHelper(
        workbook,
        namespace,
        stockUpdateFormNameFor,
        createNewStockUpdateForm
    );
    stockUpdateFormHelper.setup();
}

function setupFormHandler(workbook){
    const triggers = ScriptApp.getProjectTriggers();
    const formSubmitTrigger = triggers.find(t => t.getHandlerFunction() === FORM_HANDLER_NAME);
    if(!formSubmitTrigger){
        ScriptApp.newTrigger(FORM_HANDLER_NAME)
            .forSpreadsheet(workbook)
            .onFormSubmit()
            .create();
    }
}

function deleteWorkspace(workbook, namespace=""){
    deleteSheet(workbook, nameFor("inventory", namespace));
    deleteSheet(workbook, newProductTypeFormNameFor(namespace));
    deleteSheet(workbook, stockUpdateFormNameFor(namespace));
    if("" === namespace){
        const triggers = ScriptApp.getProjectTriggers();
        const formSubmitTrigger = triggers.find(t => {
            return t.getHandlerFunction() === FORM_HANDLER_NAME;
        });
        if(formSubmitTrigger !== null){
            ScriptApp.deleteTrigger(formSubmitTrigger);
        }
    }
}

/**
 * Deletes a sheet and any attached formsfrom the workbook if the sheet exists.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string} sheetName 
 */
function deleteSheet(workbook, sheetName){
    const sheet = workbook.getSheetByName(sheetName);
    if(sheet !== null){
        const formUrl = sheet.getFormUrl();
        if(formUrl !== null){
            // delete attached form
            const form = FormApp.openByUrl(formUrl);
            form.removeDestination();
            
            const file = DriveApp.getFileById(form.getId());
            file.setTrashed(true);
        }
        workbook.deleteSheet(sheet);
    }
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

/**
 * Each workbook should support multiple namespaces for testing purposes, though
 * should also support a default, unspecified namespace
 * @param {string} resource - sheet or form name 
 * @param {string|undefined} namespace 
 * @returns the name for the given sheet within the given namespace
 */
function nameFor(resource, namespace=""){
    mustHaveValue(resource);
    mustHaveValue(namespace);

    return ("" === namespace) ? resource : `${namespace}-${resource}`;
}



/*
Unit tests
*/

function testWorkspaceModule(){
    testNameFor();
    testGoogleSheetsProductTypeRepository();  
}

function testNameFor(){
    const sheetName = "foo";
    const namespace = "bar";
    
    const sheetWithoutNamespace = nameFor(sheetName);
    assert(sheetWithoutNamespace.includes(sheetName));

    const sheetWithNamespace = nameFor(sheetName, namespace);
    assert(sheetWithNamespace.includes(sheetName));
    assert(sheetWithNamespace.includes(namespace));
}