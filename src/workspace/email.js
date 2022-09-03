/**
 * This module is responsible for sending the inventory form and report email
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
    const regenForm = ()=>regenerateInventoryFormFor(workbook, namespace);
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
     * @param {()=>null} regenerateInventoryForm regenerates the inventory
     *  form if it is stale.
     */
    constructor(userService, sendEmail, settings, regenerateInventoryForm){
        this._users = userService;
        this._sendEmail = sendEmail;
        this._settings = settings;
        this._regenerateInventoryForm = regenerateInventoryForm;
    }

    sendInventoryForm(){
        if(this._settings.isInventoryFormStale()){
            this._regenerateInventoryForm();
        }

        const to = this._users.getInventoryFormEmails();
        if(to.length === 0){
            return;
        }

        const newProdUrl = this._settings.getNewItemFormUrl();
        const inventoryUrl = this._settings.getInventoryFormUrl();
        const sheetUrl = this._settings.getWorkbookUrl();
        const userUrl = this._settings.getUserFormUrl();
        const lines = [
            "This email was generated by the Google Workspace Inventory Tracker.",
            `This form adds a new item to your inventory: ${newProdUrl}.`,
            `This form updates the items already recorded in your inventory: ${inventoryUrl}`,
            `You can view your inventory here: ${sheetUrl}`,
            `You can change your notification preferences here: ${userUrl}`
        ];
        const email = new Email(
            to,
            "It's time to update our inventory!",
            lines.map(line => `<p>${line}</p>`).join("\n")
        );

        this._sendEmail(email);
    }

    sendInventoryFormReply(){
        const to = this._users.where(u => u.wantsLogReply);
        if(to.length === 0){
            return;
        }

        const sheetUrl = this._settings.getWorkbookUrl();
        const userUrl = this._settings.getUserFormUrl();
        const lines = [
            "This email was generated by the Google Workspace Inventory Tracker.",
            "Your inventory has been successfully updated!",
            `You can see the result of these changes here: ${sheetUrl}.`,
            `You can opt out of receiving this email here: ${userUrl}`
        ];
        const email = new Email(
            to,
            "Our inventory has been successfully updated!",
            lines.map(line => `<p>${line}</p>`).join("\n")
        );

        this._sendEmail(email);
    }

    updateTrigger(){
        const oldTriggers = ScriptApp.getProjectTriggers().filter(t => {
            return t.getHandlerFunction() === sendInventoryForm.name;
        });
        oldTriggers.forEach(t => ScriptApp.deleteTrigger(t));

        const interval = this._settings.getInventoryFormInterval();

        let msg = "The inventory form will no longer be automatically sent.";
        if(!isNaN(parseInt(interval))){
            ScriptApp.newTrigger(sendInventoryForm.name)
                .timeBased()
                .everyDays(interval)
                .create();
            msg = `The inventory form will now be sent every ${interval} days.`;
        }
        return msg;
    }
}

function sendInventoryForm(){
    createEmailService().sendInventoryForm();
}

function primeInventoryForm(){
    const msg = createEmailService().updateTrigger();
    SpreadsheetApp.getUi().alert(msg);
}


function testEmailModule(){
    const sentEmails = new Map();
    const users = [
        new User("foo.bar@gmail.com", true, false),
        new User("baz.qux@gmail.com", false, false)
    ];
    const repo = makeInMemoryUserRepository(users);
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
        ()=>settingService.setInventoryFormStale(false)
    );
    emailService.sendInventoryForm();

    assert(sentEmails.has("foo.bar@gmail.com"));
    assert(1 === sentEmails.get("foo.bar@gmail.com").length);
    assert(!sentEmails.has("baz.qux@gmail.com"));
}