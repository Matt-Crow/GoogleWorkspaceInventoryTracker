/**
 * This module is responsible for the Google Form used to update the quantity of
 * each item currently in the inventory.
 */

/**
 * Use this to interface with the Inventory form component of the system.
 * @param {SpreadsheetApp.Spreadsheet|null} workbook 
 * @param {string|undefined} namespace 
 * @returns the Inventory form component of the application
 */
function inventoryFormModule(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return new Component(
        workbook,
        namespace,
        _inventoryFormNameFor,
        (ns)=>{
            const form = _createNewInventoryForm(workbook, ns);
            createSettings(workbook, namespace).setInventoryForm(form);
            return form;
        },
        _onInventoryFormSubmit
    );
}

function _inventoryFormNameFor(namespace=""){
    return nameFor("Inventory form", namespace);
}

function _createNewInventoryForm(workbook=null, namespace=""){
    const form = FormApp.create(_inventoryFormNameFor(namespace));
    form.setDescription("How many of each of these are in the inventory now?");

    _populateInventoryForm(form, workbook, namespace);

    return form;
}

function _populateInventoryForm(form, workbook, namespace){
    const mustBeANonNegativeNumber = FormApp.createTextValidation()
        .setHelpText("Must be a non-negative number.")
        .requireNumberGreaterThanOrEqualTo(0)
        .build();
    
    const service = createItemService(workbook, namespace);
    const itemNames = service.getAllEntities().map(pt => pt.name);

    itemNames.forEach(itemName => {
        form.addTextItem()
            .setTitle(itemName)
            .setRequired(false)
            .setValidation(mustBeANonNegativeNumber);
    });
}

function _onInventoryFormSubmit(e){
    /*
    e.namedValues is formatted as
    {
        foo: ["answer to foo"],
        bar: ["answer to bar"]
    }

    From what I gather, the last value of the foo array is the response to foo.
    Previous indices are in case multiple questions have existed with the same
    name. These arrays will get longer each time the form regenerates.
    */
    const fields = [];
    for(let [k, v] of Object.entries(e.namedValues)){
        //                                       last item
        fields.push({name: k, quantity: parseInt(v[v.length - 1])});
    }

    const items = fields.filter(answerToQuestion => {
        return !isNaN(answerToQuestion.quantity);
    }).filter(answerToQuestion => {
        return "Timestamp" !== answerToQuestion.name;
    }).map(answerToQuestion =>{
        return new Item(answerToQuestion.name, answerToQuestion.quantity);
    });

    console.log(JSON.stringify(items));

    createItemService().handleLogForm(items);
}


function regenerateInventoryFormFor(workbook, namespace=""){
    const name = _inventoryFormNameFor(namespace);
    const sheet = workbook.getSheetByName(name);
    if(sheet === null){ // inventory form has not yet been generated
        inventoryFormModule(workbook, namespace).setup();
    } else {
        // remove all items, repopulate
        const formUrl = sheet.getFormUrl();
        const oldForm = FormApp.openByUrl(formUrl);
        oldForm.getItems().forEach(item=>oldForm.deleteItem(item));
        _populateInventoryForm(oldForm, workbook, namespace);
    }
    createSettings(workbook, namespace).setInventoryFormStale(false);
}