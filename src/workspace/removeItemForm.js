/**
 * This module is responsible for the Google Form used to remove an item type
 * from the inventory.
 */

function removeItemFormModule(workspace=null) {
    workspace = Workspace.currentOr(workspace);
    
    return new Component(
        workspace.workbook,
        workspace.namespace,
        _removeItemFormNameFor,
        (ns) => {
            const form = _createRemoveItemForm(workspace);
            createSettings(workspace.workbook, ns).setRemoveItemForm(form);
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

function _createRemoveItemForm(workspace) {
    const form = FormApp.create(_removeItemFormNameFor(workspace.namespace));
    form.setDescription("Remove an existing item from the inventory.");
    form.setCollectEmail(true);

    _populateRemoveItemForm(form, workspace);
    
    return form;
}

function _populateRemoveItemForm(form, workspace) {
    const service = createItemService(workspace.workbook, workspace.namespace);
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

function regenerateRemoveItemFormFor(workspace=null) {
    workspace = Workspace.currentOr(workspace);
    const name = _removeItemFormNameFor(workspace.namespace);
    const sheet = workspace.workbook.getSheetByName(name);
    if (sheet === null) { // not generated yet
        removeItemFormModule(workspace).setup();
    } else {
        // remove old choices, repopulate
        const formUrl = sheet.getFormUrl();
        const form = FormApp.openByUrl(formUrl);
        form.getItems().forEach(item => form.deleteItem(item));
        _populateRemoveItemForm(form, workspace);
    }
}