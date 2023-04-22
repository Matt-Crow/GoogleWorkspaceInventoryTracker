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
    console.log({
        event: "Received Google form",
        form: JSON.stringify(e)
    });
    
    /*
    ugly duck-typing, but it looks like e doesn't have any other way of knowing
    which form submitted it
    */
    if("Item name" in e.namedValues){
        newItemFormModule().receiveForm(e);
    } else if("Email" in e.namedValues){
        userFormModule().receiveForm(e);
    } else if("Which item do you want to remove?" in e.namedValues) {
        removeItemFormModule().receiveForm(e);
    } else {
        inventoryFormModule().receiveForm(e);
    }    
}

/**
 * Represents a virtual worksheet, which is the combination of a Google 
 * Spreadsheet (the whole workbook, not just one sheet), as well as a namespace,
 * which as prepended to sheet names. A workbook can contain multiple namespaces
 */
class Workspace {
    
    /**
     * @param {SpreadsheetApp.Spreadsheet} workbook the Google Spreadsheet this
     *  represents
     * @param {string} namespace the namespace within the workbook this 
     *  represents 
     */
    constructor(workbook, namespace) {
        this.workbook = workbook;
        this.namespace = namespace;
    }

    /**
     * @returns {Workspace} the current workspace the app is executing in
     */
    static current() {
        return new Workspace(SpreadsheetApp.getActiveSpreadsheet(), "");
    }

    /**
     * @param {Workspace|null} other possibly another workspace
     * @returns either the current workspace or the given workspace, if it is
     *  not null
     */
    static currentOr(other=null) {
        return (other === null) ? Workspace.current() : other;
    }

    /**
     * Notifies this that the types of items in the inventory have changed, and
     * thus various forms should be regenerated.
     */
    itemsChanged() {
        createSettings(this).setInventoryFormStale(true);
        regenerateRemoveItemFormFor();
    }
}

/*
Circumvents the Google script inheritance issue caused by unpredictable 
script execution order. Also note that inheritance does not work as expected
even when used in the same file as the superclass.
*/
class Component {
    /**
     * @param {Workspace} workspace the workspace this component exists in
     * @param {(string)=>string} namespaceToName maps the namespace to the name
     *  of the sheet for this component in that namespace
     * @param {()=>Form|null|undefined} create creates this sheet if it doesn't
     *  exist. It should return the form if one was created.
     * @param {(FormEvent)=>void} onSubmit handles form submissions.
     */
    constructor(workspace, namespaceToName, create, onSubmit){
        this.workspace = workspace;
        this.name = namespaceToName(workspace.namespace);
        this.create = create;
        this.onSubmit = onSubmit;
    }

    setup(){
        // does not bind 'this' context with just "this._doSetup" 
        ifSheetDoesNotExist(this.workspace.workbook, this.name, ()=>this._doSetup());
    }

    _doSetup(){
        const formOrMaybeNot = this.create();
        if(formOrMaybeNot && formOrMaybeNot.setDestination){
            this._doSetupForm(formOrMaybeNot);
        }
    }

    _doSetupForm(form){
        form.setDestination(
            FormApp.DestinationType.SPREADSHEET, 
            this.workspace.workbook.getId()
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
        const createdSheet = this.workspace.workbook.getSheets().filter(sheet => {
            return null !== sheet.getFormUrl();
        }).find(sheet => {
            const form = FormApp.openByUrl(sheet.getFormUrl());
            return form.getId() === formId; 
        });
        createdSheet.setName(this.name);
        createdSheet.hideSheet();
    }

    delete(){
        deleteSheet(this.workspace.workbook, this.name);
    }

    receiveForm(event){
        this.onSubmit(event);
    }
}

function getEmailAddressFrom(form) {
    return lastNonEmpty(form.namedValues["Email Address"]);
}

/**
 * Needed because of how Google Forms responses are formatted.
 * @param {String[]} array the array to find the last non-empty string in
 * @returns the last non-empty string in the given array
 */
function lastNonEmpty(array) {
    return array.findLast(e => e !== "");
}

function allModulesFor(workspace=null){
    workspace = Workspace.currentOr(workspace);
    return [
        settingSheetModule(workspace), // must be first
        inventorySheetModule(workspace),
        userSheetModule(workspace),
        userFormModule(workspace),
        newItemFormModule(workspace),
        inventoryFormModule(workspace),
        removeItemFormModule(workspace)
    ];
}


/**
 * Mutates the given workbook into a suitable environment for the application.
 * @param {Workspace|undefined} workspace the environment to mutate
 */
function setupWorkspace(workspace=null){
    workspace = Workspace.currentOr(workspace);
    allModulesFor(workspace).forEach(m=>m.setup());
    _setupFormHandler(workspace.workbook);
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

function deleteWorkspace(workspace=null){
    workspace = Workspace.currentOr(workspace);
    allModulesFor(workspace).forEach(m=>m.delete());
    if("" === workspace.namespace){
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
    const workspace = new Workspace(
        SpreadsheetApp.getActiveSpreadsheet(),
        "test"
    );
    deleteWorkspace(workspace);
    setupWorkspace(workspace);

    testNameFor();
    testEmailModule();
    testGoogleSheetsItemRepository(workspace.workbook);

    /*
    only remove test sheets if tests are successful, as this allows us to
    diagnose errors if one of these tests fails
    */
    deleteWorkspace(workspace);
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