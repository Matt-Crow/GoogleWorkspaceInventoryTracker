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

    const mustBeEmail = SpreadsheetApp.newDataValidation()
        .requireTextIsEmail()
        .setAllowInvalid(false)
        .setHelpText("must be a valid email address")
        .build();
    const emailCol = userSheet.getRange("A2:A");
    emailCol.setDataValidation(mustBeEmail);

    const mustBeYesOrNo = SpreadsheetApp.newDataValidation()
        .requireValueInList(["yes", "no"])
        .setAllowInvalid(false)
        .setHelpText("must be either 'yes' or 'no', without quote marks")
        .build();
    const boolCols = userSheet.getRange("B2:C");
    boolCols.setDataValidation(mustBeYesOrNo);
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
        (user)=>[
            user.email, 
            (user.wantsLog) ? "yes" : "no", 
            (user.wantsReport) ? "yes" : "no"
        ],
        (row)=>new User(
            row[0],
            row[1] === "yes",
            row[2] === "yes"
        )
    );
}