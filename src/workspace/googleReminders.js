

function createReminderService(workspace=null) {
    const ws = Workspace.currentOr(workspace);
    return new ReminderService(
        createSettings(ws.workbook, ws.namespace),
        _createGoogleReminder,
        _deleteGoogleReminder
    );
}

function _createGoogleReminder(reminder) {
    // ReminderService handles calling delete first
    ScriptApp.newTrigger(reminder.fn.name)
        .timeBased()
        .everyDays(reminder.interval)
        .create();
}

function _deleteGoogleReminder(reminder) {
    ScriptApp.getProjectTriggers()
        .filter(t => t.getHandlerFunction() === reminder.fn.name)
        .forEach(t => ScriptApp.deleteTrigger(t));
}