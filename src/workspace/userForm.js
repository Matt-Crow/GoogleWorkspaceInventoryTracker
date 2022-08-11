/**
 * This module is responsible for the Google Form used to add new users to the
 * user sheet.
 */



function userFormModule(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return new Component(
        workbook,
        namespace,
        _userFormNameFor,
        _createUserForm,
        _onUserFormSubmit
    );
}


function _userFormNameFor(namespace){
    return nameFor("user form", namespace);
}

function _createUserForm(namespace){
    const mustBeEmail = FormApp.createTextValidation()
        .setHelpText("Must be an email address")
        .requireTextIsEmail()
        .build();

    const form = FormApp.create(_userFormNameFor(namespace));
    form.setDescription("Sign up to receive the Stock Update or Log email.");

    form.addTextItem()
        .setTitle("Email")
        .setValidation(mustBeEmail)
        .setRequired(true);
    
    const stock = form.addMultipleChoiceItem();
    stock.setTitle("Would you like to receive a copy of the Stock Update form?")
        .setChoices([
            stock.createChoice("No"),
            stock.createChoice("Yes")
        ]);
    
    const log = form.addMultipleChoiceItem();
    log.setTitle("Would you like to receive a copy of the Log report email?")
        .setChoices([
            log.createChoice("No"),
            log.createChoice("Yes")
        ]);

    return form;
}

function _onUserFormSubmit(e){
    const row = e.values;
    row.shift(); // get rid of timestamp

    const email = row[0];
    const wantsLog = row[1] === "Yes";
    const wantsReport = row[2] === "Yes";
    const user = new User(email, wantsLog, wantsReport);

    console.log("New user: " + JSON.stringify(user));

    createUserService().handleUserForm(user);
}