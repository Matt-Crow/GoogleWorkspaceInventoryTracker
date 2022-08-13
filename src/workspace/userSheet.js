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
    const repo = new GoogleSheetsUserRepository(sheet);
    const service = new UserService(repo);
    return service;
}


function _userSheetNameFor(namespace=""){
    return nameFor("users", namespace);
}


class GoogleSheetsUserRepository {
    constructor(sheet){
        this._sheet = sheet;
    }

    addUser(user){
        if(this.hasUserWithEmail(user.email)){
            throw new Error(`Duplicate user email: "${user.email}"`);
        }
        this._sheet.appendRow(this._userToRow(user));
        /*
        formats blank cells in range as checkboxes, which we don't want applied
        to rows without users

        TODO use "text must be yes or no" instead
        */
        const validation = SpreadsheetApp.newDataValidation()
            .requireCheckbox()
            .setAllowInvalid(false)
            .setHelpText("Wants log and Wants report must both be checkboxes")
            .build();

        const row = this._sheet.getLastRow();
        const wantsLogAndWantsReportColumns = this._sheet.getRange(`B${row}:C${row}`);
        wantsLogAndWantsReportColumns.setDataValidation(validation);
    }

    hasUserWithEmail(email){
        const emails = this._sheet.getRange("A2:A").getValues().map(row=>row[0]);
        return emails.includes(email);
    }

    _userToRow(user){
        return [user.email, user.wantsLog, user.wantsReport];
    }

    getUserByEmail(email){
        if(!this.hasUserWithEmail(email)){
            throw new Error(`No user found with email = "${email}"`);
        }
        const rows = this._sheet.getDataRange().getValues();
        rows.shift(); // remove header

        const idx = rows.findIndex(row => row[0] === email);

        if(-1 === idx){
            throw new Error("code should not have gotten here");
        }

        return this._rowToUser(rows[idx]);
    }

    _rowToUser(row){
        return new User(
            row[0],
            !!row[1], // !! converts to boolean
            !!row[2]
        );
    }

    getAllUsers(){
        const rows = this._sheet.getDataRange().getValues();
        rows.shift();
        return rows.map(row=>this._rowToUser(row));
    }

    updateUser(user){
        const rows = this._sheet.getDataRange().getValues();
        rows.shift();

        const idx = rows.findIndex(row => row[0] === user.email);
        if(-1 === idx){
            throw new Error(`Failed to update user with email = "${user.email}"`);
        }

        const newRow = this._userToRow(user);
        //                      translate from 0 to 1 idx, +1 for header
        this._sheet.getRange(idx + 2, 1, 1, newRow.length).setValues([newRow]);
    }
}