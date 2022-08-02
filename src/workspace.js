/**
 * This module is responsible for integrating with Google Workspace. By doing so
 * in a separate file from the bulk of the system, third-party dependencies are
 * isolated from the core system, allowing it to more easily port between 
 * implementations.
 */



const FORM_HANDLER_NAME = onFormSubmit.name;



/*
this does not automatically start handling forms, and is explicitly registered
in setupFormHandler
*/
function onFormSubmit(e){
    onNewProductTypeFormSubmit(e);
}


/*
Using this to get around the Google script inheritance issue caused by 
unpredictable script execution order.
*/
class FormHelper {
    /**
     * 
     * @param {SpreadsheetApp.Spreadsheet} workbook 
     * @param {string} name 
     * @param {FormApp.Form function(string)} create
     * @param {*} deleteForm 
     */
    constructor(workbook, name, create, deleteForm){
        this.workbook = workbook;
        this.name = name;
        this.create = create;
        this.deleteForm = deleteForm;
    }

    setup(){
        const sheet = this.workbook.getSheetByName(this.name);
        if(null === sheet){
            this._doSetup();
        }
    }

    _doSetup(){
        const form = this.create(this.name);
        form.setDestination(
            FormApp.DestinationType.SPREADSHEET, 
            this.workbook.getId()
        );

        /*
        The form is created using the Google Forms service instead of the Sheets
        service, so the call to setDestination does not alter workbook. Sheets
        caches the contents of the spreadsheet when it is accessed using
        SpreadsheetApp, and the contents are only updated when a writing 
        function is used. Since getSheets is a reading call, it reads the cached
        list of sheets, which excludes the newly created destination sheet.
        
        https://issuetracker.google.com/issues/36764101
        */
        SpreadsheetApp.flush(); // updates the workbook variable
        
        // rename the sheet created by setDestination so it's easier to find
        // this URL solution doesn't work: https://stackoverflow.com/a/51484165
        const formId = form.getId();
        const createdSheet = this.workbook.getSheets().filter(sheet => {
            return null !== sheet.getFormUrl();
        }).find(sheet => {
            const form = FormApp.openByUrl(sheet.getFormUrl());
            return form.getId() === formId; 
        });
        createdSheet.setName(this.name);
    }

    deleteForm(){
        deleteSheet(this.workbook, this.name);
    }
}


/**
 * Mutates the given workbook into a suitable environment for the application.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string|undefined} namespace - can specify for testing
 */
function setupWorkspace(workbook, namespace=""){
    setupInventorySheet(workbook, namespace);

    const newProductTypeFormHelper = new FormHelper(
        workbook,
        newProductTypeFormNameFor(namespace),
        createNewProductTypeForm
    );
    newProductTypeFormHelper.setup();

    setupFormHandler(workbook);
}

function setupFormHandler(workbook){
    const triggers = ScriptApp.getProjectTriggers();
    const formSubmitTrigger = triggers.find(t => t.getHandlerFunction() === FORM_HANDLER_NAME);
    if(!formSubmitTrigger){
        ScriptApp.newTrigger(FORM_HANDLER_NAME)
            .forSpreadsheet(workbook)
            .onFormSubmit()
            .create();
    }
}

function deleteWorkspace(workbook, namespace=""){
    deleteSheet(workbook, sheetNameFor("inventory", namespace));
    deleteSheet(workbook, newProductTypeFormNameFor(namespace));
    if("" === namespace){
        const triggers = ScriptApp.getProjectTriggers();
        const formSubmitTrigger = triggers.find(t => {
            return t.getHandlerFunction() === FORM_HANDLER_NAME;
        });
        if(formSubmitTrigger !== null){
            ScriptApp.deleteTrigger(formSubmitTrigger);
        }
    }
}

/**
 * Deletes a sheet and any attached formsfrom the workbook if the sheet exists.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string} sheetName 
 */
function deleteSheet(workbook, sheetName){
    const sheet = workbook.getSheetByName(sheetName);
    if(sheet !== null){
        const formUrl = sheet.getFormUrl();
        if(formUrl !== null){
            // delete attached form
            const form = FormApp.openByUrl(formUrl);
            form.removeDestination();
            
            const file = DriveApp.getFileById(form.getId());
            file.setTrashed(true);
        }
        workbook.deleteSheet(sheet);
    }
}

/**
 * @param {SpreadsheetApp.Spreadsheet} workbook
 * @param {string} sheetName 
 * @param {void function(string)} doThis 
 */
function ifSheetDoesNotExist(workbook, sheetName, doThis){
    if(null === workbook.getSheetByName(sheetName)){
        doThis(sheetName);
    }
}

/**
 * Each workbook should support multiple namespaces for testing purposes, though
 * should also support a default, unspecified namespace
 * @param {string} sheetName 
 * @param {string|undefined} namespace 
 * @returns the name for the given sheet within the given namespace
 */
function sheetNameFor(sheetName, namespace=""){
    mustHaveValue(sheetName);
    mustHaveValue(namespace);

    return ("" === namespace) ? sheetName : `${namespace}-${sheetName}`;
}



/*
Unit tests
*/

function testWorkspaceModule(){
    testSheetNameFor();
    testGoogleSheetsProductTypeRepository();    
}

function testSheetNameFor(){
    const sheetName = "foo";
    const namespace = "bar";
    
    const sheetWithoutNamespace = sheetNameFor(sheetName);
    assert(sheetWithoutNamespace.includes(sheetName));

    const sheetWithNamespace = sheetNameFor(sheetName, namespace);
    assert(sheetWithNamespace.includes(sheetName));
    assert(sheetWithNamespace.includes(namespace));
}