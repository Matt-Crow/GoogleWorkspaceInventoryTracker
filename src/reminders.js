/**
 * Code related to scheduling and managing automated reminders
 */



class ReminderService {
    constructor(){

    }

    sendInventoryReminder(){

    }

    scheduleInventoryReminder(){

    }

    unscheduleInventoryReminder(){

    }

    sendRestockReminder(){

    }

    scheduleRestockReminder(){

    }

    unscheduleRestockReminder(){

    }
}

class Reminder {
    constructor(name, send, schedule, unschedule){
        this.name = name;
        this._send = send;
        this._schedule = schedule;
        this._unschedule = unschedule;
    }
}