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
            const form = _createRemoveItemForm(workbook, ns);
            createSettings(workbook, ns).setRemoveItemForm(form);
            return form;
        },
        _onRemoveItemFormSubmit
    );
}

/*
Private functions
*/

function _removeItemFormNameFor(namespace="") {
    return nameFor("Remove item", namespace);
}

function _createRemoveItemForm(workbook, namespace) {
    const form = FormApp.create(_removeItemFormNameFor(namespace));
    form.setDescription("Remove an existing item from the inventory.");

    _populateRemoveItemForm(form, workbook, namespace);
    
    return form;
}

function _populateRemoveItemForm(form, workbook=null, namespace="") {
    if (workbook === null) {
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }

    const service = createItemService(workbook, namespace);
    const itemNames = service.getAllEntities().map(item => item.name);
    if (itemNames.length === 0) {
        itemNames.push("---");
    }

    const dropDown = form.addListItem();
    dropDown.setTitle("Which item do you want to remove?")
        .setChoices(itemNames.map(opt => dropDown.createChoice(opt)));
}

function _onRemoveItemFormSubmit(event) {
    /**
     * Every time the form regenerates, event.values gets an extra empty string
     * appended after the timestamp. The last value in the array is the one we
     * want, so grab that one.
     */
    const name = event.values.at(-1);

    createItemService().remove(name);
    Workspace.current().itemsChanged();
}

function regenerateRemoveItemFormFor(workbook=null, namespace="") {
    if (workbook === null) {
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }

    const name = _removeItemFormNameFor(namespace);
    const sheet = workbook.getSheetByName(name);
    if (sheet === null) { // not generated yet
        removeItemFormModule(workbook, namespace).setup();
    } else {
        // remove old choices, repopulate
        const formUrl = sheet.getFormUrl();
        const form = FormApp.openByUrl(formUrl);
        form.getItems().forEach(item => form.deleteItem(item));
        _populateRemoveItemForm(form, workbook, namespace);
    }
}