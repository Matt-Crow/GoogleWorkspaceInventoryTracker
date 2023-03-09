/**
 * This module is responsible for the Google Form used to add new users to the
 * user sheet.
 */



function userFormModule(workspace=null){
    workspace = Workspace.currentOr(workspace);
    return new Component(
        workspace,
        _userFormNameFor,
        (ns)=>{
            const form = _createUserForm(ns);
            createSettings(workspace.workbook, workspace.namespace)
                .setUserForm(form);
            return form;
        },
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
    form.setDescription("Sign up to receive email notifications.");

    form.addTextItem()
        .setTitle("Email")
        .setValidation(mustBeEmail)
        .setRequired(true);
    
    const inventory = form.addMultipleChoiceItem();
    inventory.setTitle("Would you like to receive the inventory form so you can update the inventory?")
        .setChoices([
            inventory.createChoice("No"),
            inventory.createChoice("Yes")
        ])
        .setRequired(true);
    
    const reply = form.addMultipleChoiceItem();
    reply.setTitle("Would you like to receive the an email whenever someone submits the inventory form?")
        .setChoices([
            reply.createChoice("No"),
            reply.createChoice("Yes")
        ])
        .setRequired(true);
    
    const log = form.addMultipleChoiceItem();
    log.setTitle("Would you like to receive the inventory report so you can see what's running low on stock?")
        .setChoices([
            log.createChoice("No"),
            log.createChoice("Yes")
        ])
        .setRequired(true);

    return form;
}

function _onUserFormSubmit(e){
    const row = e.values;
    row.shift(); // get rid of timestamp

    // overrides previous user preferences, which the client is OK with
    const email = row[0];
    const wantsLog = row[1] === "Yes";
    const wantsLogReply = row[2] === "Yes";
    const wantsReport = row[3] === "Yes";
    const user = new User(email, wantsLog, wantsLogReply, wantsReport);

    console.log("New user: " + JSON.stringify(user));

    createUserService().handleUserForm(user);
}