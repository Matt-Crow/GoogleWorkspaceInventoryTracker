/**
 * This module is responsible for implementing email.js using the Google Mail 
 * App.
 * 
 * https://developers.google.com/apps-script/reference/mail
 */

 function createEmailService(workspace=null){
    workspace = Workspace.currentOr(workspace);   
    const users = createUserService(workspace.workbook, workspace.namespace);
    const emailSender = (email)=>MailApp.sendEmail({ // convert my model to the
        to: email.to.join(","),                      // one MailApp uses
        subject: email.subject,
        htmlBody: email.bodyHtml
    });
    const settings = createSettings(workspace.workbook, workspace.namespace);
    const regenForm = ()=>regenerateInventoryFormFor(workspace.workbook, workspace.namespace);
    return new EmailService(users, emailSender, settings, regenForm);
}