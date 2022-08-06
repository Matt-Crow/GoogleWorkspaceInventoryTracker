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