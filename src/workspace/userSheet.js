/**
 * This module is responsible for the user sheet created by the application in
 * its host Google Spreadsheet
 */



function userSheetModule(workbook, namespace){
    return new Component(
        workbook,
        namespace,
        _userSheetNameFor,
        (ns)=>_setupUserSheet(workbook, ns)
    );
}


function _setupUserSheet(workbook, namespace){
    const userSheet = workbook.insertSheet(_userSheetNameFor(namespace));
    userSheet.setFrozenRows(1);

    const headers = ["email", "wants log", "wants report"];
    userSheet.appendRow(headers);
}


function _userSheetNameFor(namespace=""){
    return nameFor("users", namespace);
}


/**
 * Use this to access the UserService
 * @param {undefined|SpreadsheetApp.Spreadsheet} workbook 
 * @param {undefined|string} namespace
 * @return {UserService} a UserService for interacting with this workbook 
 */
function createUserService(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    const sheet = workbook.getSheetByName(_userSheetNameFor(namespace));
    const repo = _makeGoogleSheetsUserRepository(sheet);
    const service = new UserService(repo);
    return service;
}


function _makeGoogleSheetsUserRepository(sheet){
    return new GoogleSheetsRepository(
        sheet,
        (user)=>user.email,
        (user)=>[user.email, user.wantsLog, user.wantsReport],
        (row)=>new User(
            row[0],
            row[1] === "yes",
            row[2] === "yes"
        )
    );
}