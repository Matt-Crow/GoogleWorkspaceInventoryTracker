/**
 * This module is responsible for the Google Form used to update the quantity of
 * each product currently in the inventory.
 */

/**
 * Use this to interface with the "Stock Update" form component of the system.
 * @param {SpreadsheetApp.Spreadsheet|null} workbook 
 * @param {string|undefined} namespace 
 * @returns the "Stock Update" form component of the application
 */
function stockUpdateFormModule(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return new Component(
        workbook,
        namespace,
        _stockUpdateFormNameFor,
        (ns)=>{
            const form = _createNewStockUpdateForm(ns);
            createSettings(workbook, namespace).setStockUpdateForm(form);
            return form;
        },
        _onStockUpdateFormSubmit
    );
}

function _stockUpdateFormNameFor(namespace=""){
    return nameFor("Stock Update", namespace);
}

function _createNewStockUpdateForm(namespace=""){
    const form = FormApp.create(_stockUpdateFormNameFor(namespace));
    form.setDescription("How many of each of these are in stock now?");

    _populateStockUpdateForm(form, namespace);

    return form;
}

function _populateStockUpdateForm(form, namespace){
    const mustBeANonNegativeNumber = FormApp.createTextValidation()
        .setHelpText("Must be a non-negative number.")
        .requireNumberGreaterThanOrEqualTo(0)
        .build();
    
    const service = createProductService(namespace);
    const productNames = service.getAllEntities().map(pt => pt.name);

    productNames.forEach(productName => {
        form.addTextItem()
            .setTitle(productName)
            .setRequired(false)
            .setValidation(mustBeANonNegativeNumber);
    });
}

function _onStockUpdateFormSubmit(e){
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

    const products = fields.filter(answerToQuestion => {
        return !isNaN(answerToQuestion.quantity);
    }).filter(answerToQuestion => {
        return "Timestamp" !== answerToQuestion.name;
    }).map(answerToQuestion =>{
        return new ProductType(answerToQuestion.name, answerToQuestion.quantity);
    });

    console.log(JSON.stringify(products));

    createProductService().handleLogForm(products);
}


function regenerateStockUpdateFormFor(workbook, namespace=""){
    const name = _stockUpdateFormNameFor(namespace);
    const sheet = workbook.getSheetByName(name);
    if(sheet === null){ // stock update form has not yet been generated
        stockUpdateFormModule(workbook, namespace).setup();
    } else {
        // remove all items, repopulate
        const formUrl = sheet.getFormUrl();
        const oldForm = FormApp.openByUrl(formUrl);
        oldForm.getItems().forEach(item=>oldForm.deleteItem(item));
        _populateStockUpdateForm(oldForm, namespace);
    }
    createSettings(workbook, namespace).setStockUpdateFormStale(false);
}