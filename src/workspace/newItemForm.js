/**
 * This module is responsible for the Google Form used to add new items to the 
 * inventory.
 */



/**
 * Use this to interface with the "New Item" form component of the 
 * system.
 * @param {SpreadsheetApp.Spreadsheet|null} workbook 
 * @param {string|undefined} namespace 
 * @returns the "New Item" form component of the application
 */
function newItemFormModule(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return new Component(
        workbook,
        namespace,
        _newItemFormNameFor,
        (ns)=>{
            const form = _createNewItemForm(ns);
            createSettings(workbook, namespace).setNewItemForm(form);
            return form;
        },
        _onNewItemFormSubmit
    );
}


/*
Private functions
*/


function _newItemFormNameFor(namespace=""){
    return nameFor("New item", namespace);
}

function _createNewItemForm(namespace){
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
    
    const form = FormApp.create(_newItemFormNameFor(namespace));
    form.setDescription("Add a new item to the inventory.");

    form.addTextItem()
        .setTitle("Item name")
        .setRequired(true);

    form.addTextItem()
        .setTitle("How many are in the inventory now?")
        .setValidation(mustBeANonNegativeNumber);
    
    form.addTextItem()
        .setTitle("How many do you want to keep in the inventory at all times?")
        .setValidation(mustBeANonNegativeNumber);

    return form;
}

function _onNewItemFormSubmit(event){
    const row = event.values;
    row.shift(); // remove first cell (timestamp)
    
    const name = row[0];
    const quantity = parseInt(row[1]);
    const minimum = parseInt(row[2]);

    const item = new Item(
        name,
        (isNaN(quantity)) ? undefined : quantity,
        (isNaN(minimum)) ? undefined : minimum
    );
    console.log("New item: " + JSON.stringify(item));

    createItemService().handleNewItem(item);
    createSettings().setInventoryFormStale(true);
}