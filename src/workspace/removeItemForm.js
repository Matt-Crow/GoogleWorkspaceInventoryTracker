/**
 * This module is responsible for the Google Form used to remove an item type
 * from the inventory.
 */

function removeItemFormModule(workbook=null, namespace="") {
    if (workbook === null) {
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }

    return new Component(
        workbook,
        namespace,
        _removeItemFormNameFor,
        (ns) => {
            const itemService = createItemService(workbook, namespace);
            const items = itemService.getAllEntities();
            const options = items.map(item => item.name);
            const form = _createRemoveItemForm(ns, options);
            createSettings(workbook, namespace).setRemoveItemForm(form);
            return form;
        },
        _onRemoveItemFormSubmit
    );
}

/*
Private functions
*/

function _removeItemFormNameFor(namespace="") {
    return _newItemFormNameFor("Remove item", namespace);
}

function _createRemoveItemForm(namespace, options) {
    const form = FormApp.create(_removeItemFormNameFor(namespace));
    form.setDescription("Remove an existing item from the inventory.");

    const dropDown = form.addListItem();
    dropDown.setTitle("Which item do you want to remove?")
        .setChoices(options.map(opt => dropDown.createChoice(opt)));
    
    return form;
}

function _onRemoveItemFormSubmit(event) {
    console.log(event); // todo
}