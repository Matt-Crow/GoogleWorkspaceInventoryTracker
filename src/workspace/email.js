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
    const emailSender = (email)=>MailApp.sendEmail({
        to: email.to.join(","),
        subject: email.subject,
        htmlBody: email.bodyHtml
    });
    const settings = createSettings(workbook, namespace);
    const regenForm = ()=>regenerateStockUpdateFormFor(workbook, namespace);
    return new EmailService(users, emailSender, settings, regenForm);
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
     * @param {UserService} userService used to get lists of users who want
     *  each email type.
     * @param {(email)=>any} sendEmail sends emails
     * @param {Settings} settings contains email settings
     * @param {()=>null} regenerateStockUpdateForm regenerates the stock update
     *  form if it is stale.
     */
    constructor(userService, sendEmail, settings, regenerateStockUpdateForm){
        this._users = userService;
        this._sendEmail = sendEmail;
        this._settings = settings;
        this._regenerateStockUpdateForm = regenerateStockUpdateForm;
    }

    sendStockUpdateForm(){
        if(this._settings.isStockUpdateFormStale()){
            this._regenerateStockUpdateForm();
        }

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
        this._settings.setStockUpdateLastSent(new Date());
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
    const emailRecorder = (email)=>{
        email.to.forEach(addr=>{
            if(!sentEmails.has(addr)){
                sentEmails.set(addr, []);
            }
            sentEmails.get(addr).push(email);
        });
    };
    const settingService = new Settings(
        k => settings[k],
        (k, v)=> {
            if(!settings[k]){
                settings[k] = new Setting(k, v);
            } else {
                settings[k].value = v;
            }
        },
        setting => settings[setting.name] = setting
    );
    settingService.populateDefaults();
    const emailService = new EmailService(
        userService,
        emailRecorder,
        settingService,
        ()=>settingService.setStockUpdateFormStale(false)
    );
    emailService.sendStockUpdateForm();

    assert(sentEmails.has("foo.bar@gmail.com"));
    assert(1 === sentEmails.get("foo.bar@gmail.com").length);
    assert(!sentEmails.has("baz.qux@gmail.com"));
}