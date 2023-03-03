/**
 * This module is responsible for implementing email.js using the Google Mail 
 * App.
 * 
 * https://developers.google.com/apps-script/reference/mail
 */

 function createEmailService(workbook=null, namespace=""){
    if(workbook===null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const users = createUserService(workbook, namespace);
    const emailSender = (email)=>MailApp.sendEmail({ // convert my model to the
        to: email.to.join(","),                      // one MailApp uses
        subject: email.subject,
        htmlBody: email.bodyHtml
    });
    const settings = createSettings(workbook, namespace);
    const regenForm = ()=>regenerateInventoryFormFor(workbook, namespace);
    return new EmailService(users, emailSender, settings, regenForm);
}