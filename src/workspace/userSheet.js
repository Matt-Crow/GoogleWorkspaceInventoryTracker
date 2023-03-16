/**
 * This module is responsible for the user sheet created by the application in
 * its host Google Spreadsheet
 */



function userSheetModule(workspace=null){
    workspace = Workspace.currentOr(workspace);
    return new Component(
        workspace,
        _userSheetNameFor,
        ()=>_setupUserSheet(workspace) // not just _setupUserSheet
    );
}


function _setupUserSheet(workspace){
    const name = _userSheetNameFor(workspace.namespace);
    const userSheet = workspace.workbook.insertSheet(name);
    userSheet.setFrozenRows(1);

    const headers = ["email", "wants log", "wants log reply", "wants report"];
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
    const boolCols = userSheet.getRange("B2:D");
    boolCols.setDataValidation(mustBeYesOrNo);
}


function _userSheetNameFor(namespace=""){
    return nameFor("users", namespace);
}


/**
 * Use this to access the UserService
 * @param {Workspace|undefined} workspace the workspace to create the service in
 * @return {UserService} a UserService for interacting with this workbook 
 */
function createUserService(workspace=null){
    workspace = Workspace.currentOr(workspace);
    const name = _userSheetNameFor(workspace.namespace);
    const sheet = workspace.workbook.getSheetByName(name);
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
            (user.wantsLogReply) ? "yes" : "no",
            (user.wantsReport) ? "yes" : "no"
        ],
        (row)=>new User(
            row[0],
            row[1] === "yes", // empty cells count as "no"
            row[2] === "yes",
            row[3] === "yes"
        )
    );
}