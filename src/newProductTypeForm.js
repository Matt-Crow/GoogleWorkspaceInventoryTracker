/**
 * This module is responsible for the Google Form used to add new product types
 * to the inventory.
 */

function newProductTypeFormNameFor(namespace){
    let name = "New Product Type";
    if(namespace !== ""){
        name += " - " + namespace;
    }
    return name;
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

    const repo = new GoogleSheetsProductTypeRepository(
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetNameFor("inventory"))
    );
    const service = new ProductTypeService(repo);
    service.handleNewProduct(product);
}

/**
 * Creates the form which the stock keeper will use to add new product types to
 * the inventory.
 * @param {string} name
 * @return {FormApp.Form} the created form
 */
 function createNewProductTypeForm(name){
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
    
    const form = FormApp.create(name);
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