/**
 * This module is responsible for integrating with Google Workspace. By doing so
 * in a separate file from the bulk of the system, third-party dependencies are
 * isolated from the core system, allowing it to more easily port between 
 * implementations.
 * 
 * About NAMESPACES:
 *  since some of the project's tests must interact with Google sheets, there
 *  must be some way of preventing those tests from modifying the sheets used
 *  by the application. To do this, NAMESPACES can be included in a sheet name
 *  to designate who they belong to. This is done through the nameFor function:
 *      nameFor(resourceName, namespace)
 */



const FORM_HANDLER_NAME = onFormSubmit.name;



/*
this does not automatically start handling forms, and is explicitly registered
in _setupFormHandler
*/
function onFormSubmit(e){
    console.log("Received form submission: \n" + JSON.stringify(e));
    /*
    ugly duck-typing, but it looks like e doesn't have any other way of knowing
    which form submitted it
    */
    if("Product name" in e.namedValues){
        newProductTypeFormModule().receiveForm(e);
    } else if("Email" in e.namedValues){
        userFormModule().receiveForm(e);
    } else {
        stockUpdateFormModule().receiveForm(e);
    }    
}




/*
Circumvents the Google script inheritance issue caused by unpredictable 
script execution order. Also note that inheritance does not work as expected
even when used in the same file as the superclass.
*/
class Component {
    /**
     * @param {SpreadsheetApp.Spreadsheet} workbook 
     * @param {string} namespace 
     * @param {(string)=>string} namespaceToName
     * @param {(string)=>Form|null|undefined} create
     * @param {(FormEvent)=>void} onSubmit 
     */
    constructor(workbook, namespace, namespaceToName, create, onSubmit){
        this.workbook = workbook;
        this.namespace = namespace;
        this.name = namespaceToName(namespace);
        this.create = create;
        this.onSubmit = onSubmit;
    }

    setup(){
        // does not bind 'this' context with just "this._doSetup" 
        ifSheetDoesNotExist(this.workbook, this.name, ()=>this._doSetup());
    }

    _doSetup(){
        const formOrMaybeNot = this.create(this.namespace); // NOT this.name
        if(formOrMaybeNot && formOrMaybeNot.setDestination){
            this._doSetupForm(formOrMaybeNot);
        }
    }

    _doSetupForm(form){
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

    delete(){
        deleteSheet(this.workbook, this.name);
    }

    receiveForm(event){
        this.onSubmit(event);
    }
}

function allModulesFor(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return [
        inventorySheetModule(workbook, namespace),
        userSheetModule(workbook, namespace),
        settingSheetModule(workbook, namespace),
        userFormModule(workbook, namespace),
        newProductTypeFormModule(workbook, namespace),
        stockUpdateFormModule(workbook, namespace)
    ];
}


/**
 * Mutates the given workbook into a suitable environment for the application.
 * @param {SpreadsheetApp.Spreadsheet} workbook 
 * @param {string|undefined} namespace - can specify for testing
 */
function setupWorkspace(workbook, namespace=""){
    allModulesFor(workbook, namespace).forEach(m=>m.setup());
    _setupFormHandler(workbook);
}

function _setupFormHandler(workbook){
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
    allModulesFor(workbook, namespace).forEach(m=>m.delete());
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
 * @param {string} resource - sheet or form name 
 * @param {string|undefined} namespace 
 * @returns the name for the given sheet within the given namespace
 */
function nameFor(resource, namespace=""){
    mustHaveValue(resource);
    mustHaveValue(namespace);

    return ("" === namespace) ? resource : `${namespace}-${resource}`;
}



/*
Unit tests
*/

function testWorkspaceModule(){
    testNameFor();
    testEmailModule();
    testGoogleSheetsProductTypeRepository();  
}

function testNameFor(){
    const sheetName = "foo";
    const namespace = "bar";
    
    const sheetWithoutNamespace = nameFor(sheetName);
    assert(sheetWithoutNamespace.includes(sheetName));

    const sheetWithNamespace = nameFor(sheetName, namespace);
    assert(sheetWithNamespace.includes(sheetName));
    assert(sheetWithNamespace.includes(namespace));
}