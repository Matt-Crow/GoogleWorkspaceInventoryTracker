/**
 * Code related to scheduling and managing automated reminders
 */

/**
 * A reminder is a function that should be called by an executor according to a
 * specific interval, such as every 7 days.
 */
class Reminder {

    /**
     * @param {String} name a name for this reminder
     * @param {()=>any} fn a function which accepts no arguments
     * @param {int} interval the interval, in days, between executions
     */
    constructor(name, fn, interval){
        this.name = name;
        this.fn = fn;
        this.interval = interval;
        this.wasCreated = false;
    }

    created() {
        this.wasCreated = true;
    }
}

/**
 * Handles creating & deleting reminders
 */
class ReminderService {

    /**
     * @param {Settings} settings the application settings
     * @param {(Reminder)=>any} createReminder registers the given reminder with
     *  an executor
     * @param {(Reminder)=>any} deleteReminder unregisters the given reminder 
     *  with an executor
     */
    constructor(settings, createReminder, deleteReminder){
        this._settings = settings;
        this._createReminder = createReminder;
        this._deleteReminder = deleteReminder;
    }

    scheduleInventoryForm(){
        const interval = this._settings.getInventoryFormInterval();
        const reminder = new Reminder("Inventory form", sendInventoryForm, interval);
        return this._scheduleReminder(reminder);
    }

    scheduleInventoryReport(){
        const interval = this._settings.getInventoryReportInterval();
        const reminder = new Reminder("Inventory report", sendInventoryReport, interval);
        return this._scheduleReminder(reminder);
    }

    _scheduleReminder(reminder) {
        this._deleteReminder(reminder);
        if (!isNaN(parseInt(reminder.interval))) {
            this._createReminder(reminder);
            reminder.created();
        }
        return reminder;
    }
}