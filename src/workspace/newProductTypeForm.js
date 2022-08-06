/**
 * This module is responsible for the Google Form used to add new product types
 * to the inventory.
 */



/**
 * Use this to interface with the "New Product Type" form component of the 
 * system.
 * @param {SpreadsheetApp.Spreadsheet|null} workbook 
 * @param {string|undefined} namespace 
 * @returns the "New Product Type" form component of the application
 */
function newProductTypeFormModule(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return new Component(
        workbook,
        namespace,
        _newProductTypeFormNameFor,
        _createNewProductTypeForm,
        _onNewProductTypeFormSubmit
    );
}


/*
Private functions
*/


function _newProductTypeFormNameFor(namespace=""){
    return nameFor("New Product Type", namespace);
}

function _createNewProductTypeForm(namespace){
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
    
    const form = FormApp.create(_newProductTypeFormNameFor(namespace));
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

    return form;
}

function _onNewProductTypeFormSubmit(event){
    const row = event.values;
    row.shift(); // remove first cell (timestamp)
    
    const name = row[0];
    const quantity = parseInt(row[1]);
    const minimum = parseInt(row[2]);

    const product = new ProductType(
        name,
        (isNaN(quantity)) ? undefined : quantity,
        (isNaN(minimum)) ? undefined : minimum
    );
    console.log("New product: " + JSON.stringify(product));

    createProductService().handleNewProduct(product);
}