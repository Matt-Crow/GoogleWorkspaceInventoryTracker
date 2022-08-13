/**
 * This module is responsible for sending the stock update form and report email
 * 
 * https://developers.google.com/apps-script/reference/mail
 */



function createEmailService(workbook=null, namespace=""){
    if(workbook===null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const users = createUserService(workbook, namespace);
    const emailSettingsRepository = new EmailSettingsRepository(
        ()=>_readEmailSheet(workbook, namespace),
        (newSettings)=>_updateEmailSheet(workbook, namespace, newSettings)
    );
    const emailSender = (email)=>MailApp.sendEmail({
        to: email.to.join(","),
        subject: email.subject,
        htmlBody: email.bodyHtml
    });

    return new EmailService(users, emailSettingsRepository, emailSender);
}


function _readEmailSheet(workbook, namespace){
    const sheet = workbook.getSheetByName(_emailNameFor(namespace));
    const data = sheet.getRange("A2:B2").getValues();
    const settings = {
        stockUpdateFormInterval: data[0][0] ?? 7,
        stockUpdateFormLastSent: data[0][1] ?? null
    };
    return settings;
}

function _updateEmailSheet(workbook, namespace, newSettings){
    const sheet = workbook.getSheetByName(_emailNameFor(namespace));
    const range = sheet.getRange("A2:B2");
    range.setValues([
        [newSettings.stockUpdateFormInterval, newSettings.stockUpdateFormLastSent]
    ]);
}


function emailModule(workbook=null, namespace=""){
    if(workbook===null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    return new Component(
        workbook,
        namespace,
        _emailNameFor,
        (ns)=>_createEmailSheet(workbook, ns)
    );
}

function _emailNameFor(namespace=""){
    return nameFor("email settings", namespace);
}

function _createEmailSheet(workbook, namespace){
    const emailSheet = workbook.insertSheet(_emailNameFor(namespace));
    emailSheet.setFrozenRows(1);

    const headers = ["stock update form interval", "stock update form last sent"];
    emailSheet.appendRow(headers);
}


class EmailSettingsRepository{
    constructor(load, save){
        this.load = load;
        this.save = save;
    }
}


class Email {
    constructor(to=[], subject="", bodyHtml=""){
        if(!Array.isArray(to)){
            to = [to];
        }
        this.to = to;
        this.subject = subject;
        this.bodyHtml = bodyHtml;
    }
}



class EmailService {
    /**
     * @param {UserService} userService - used to get lists of users who want
     *  each email type.
     * @param {EmailSettingsRepository} emailSettingsRepository - saves & loads
     *  email settings
     * @param {(email)=>any} sendEmail - sends emails
     */
    constructor(userService, emailSettingsRepository, sendEmail){
        this._users = userService;
        this._emailSettings = emailSettingsRepository;
        this._sendEmail = sendEmail;
    }

    sendStockUpdateForm(){
        const settings = this._emailSettings.load();
        const to = this._users.getStockUpdateFormEmails();

        if(to.length === 0){
            throw new Error("Nobody wants the stock update form");
        }

        const email = new Email(
            to,
            "Test subject",
            "<h1>Test</h1><i>hi</i>"
        );

        this._sendEmail(email);
        settings.stockUpdateFormLastSent = new Date();
        this._emailSettings.save(settings);
    }
}



function testEmailModule(){
    const sentEmails = new Map();
    const users = [
        new User("foo.bar@gmail.com", true, false),
        new User("baz.qux@gmail.com", false, false)
    ];
    const repo = new InMemoryUserRepository(users);
    const userService = new UserService(repo);
    let settings = {};
    const emailSettingsRepository = new EmailSettingsRepository(
        ()=>settings,
        (newSettings)=>settings = newSettings
    );
    const emailRecorder = (email)=>{
        email.to.forEach(addr=>{
            if(!sentEmails.has(addr)){
                sentEmails.set(addr, []);
            }
            sentEmails.get(addr).push(email);
        });
    };
    const emailService = new EmailService(
        userService, 
        emailSettingsRepository, 
        emailRecorder
    );
    emailService.sendStockUpdateForm();

    assert(sentEmails.has("foo.bar@gmail.com"));
    assert(1 === sentEmails.get("foo.bar@gmail.com").length);
    assert(!sentEmails.has("baz.qux@gmail.com"));
}