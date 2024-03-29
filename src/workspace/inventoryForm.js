/**
 * This module is responsible for the Google Form used to update the quantity of
 * each item currently in the inventory.
 */

/**
 * Use this to interface with the Inventory form component of the system.
 * @param {Workspace|undefined} workspace the workspace to get the component of 
 * @returns the Inventory form component of the application
 */
function inventoryFormModule(workspace=null){
    workspace = Workspace.currentOr(workspace);
    return new Component(
        workspace,
        _inventoryFormNameFor,
        ()=>{
            const form = _createNewInventoryForm(workspace);
            createSettings(workspace).setInventoryForm(form);
            return form;
        },
        _onInventoryFormSubmit
    );
}

function _inventoryFormNameFor(namespace=""){
    return nameFor("Inventory form", namespace);
}

function _createNewInventoryForm(workspace){
    const form = FormApp.create(_inventoryFormNameFor(workspace.namespace));
    form.setDescription("How many of each of these are in the inventory now?");
    form.setCollectEmail(true);
    
    _populateInventoryForm(form, workspace);

    return form;
}

function _populateInventoryForm(form, workspace){
    const mustBeANonNegativeNumber = FormApp.createTextValidation()
        .setHelpText("Must be a non-negative number.")
        .requireNumberGreaterThanOrEqualTo(0)
        .build();
    
    const service = createItemService(workspace);
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
        fields.push({
            name: k, 
            quantity: parseInt(lastNonEmpty(v))
        });
    }

    const items = fields.filter(answerToQuestion => {
        return !isNaN(answerToQuestion.quantity);
    }).filter(answerToQuestion => {
        return "Timestamp" !== answerToQuestion.name;
    }).filter(answerToQuestion => {
        return "Email Address" !== answerToQuestion.name;
    }).map(answerToQuestion =>{
        return new Item(answerToQuestion.name, answerToQuestion.quantity);
    });

    const email = getEmailAddressFrom(e);
    console.log({
        event: `Received inventory form from ${email}`,
        items: items
    });

    createItemService().handleLogForm(items);
}

/**
 * Regenerates the inventory form by populating it with the current contents of
 * the inventory sheet.
 * 
 * @param {Workspace} workspace the workspace to regenerate the inventory form
 *  for.
 */
function regenerateInventoryFormFor(workspace=null){
    workspace = Workspace.currentOr(workspace);
    const name = _inventoryFormNameFor(workspace.namespace);
    const sheet = workspace.workbook.getSheetByName(name);
    if(sheet === null){ // inventory form has not yet been generated
        inventoryFormModule(workspace).setup();
    } else {
        // remove all items, repopulate
        const formUrl = sheet.getFormUrl();
        const oldForm = FormApp.openByUrl(formUrl);
        oldForm.getItems().forEach(item=>oldForm.deleteItem(item));
        _populateInventoryForm(oldForm, workspace);
    }
    createSettings(workspace).setInventoryFormStale(false);
}