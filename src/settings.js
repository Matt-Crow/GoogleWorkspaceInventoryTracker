/**
 * This module is responsible for the the settings system the program uses.
 * Settings are essentially key-value pairs with a description attached.
 */

const KEYS = {
    INVENTORY_FORM_INTERVAL: "inventory form interval",
    INVENTORY_FORM_STALE: "inventory form is stale",
    INVENTORY_FORM_URL: "Inventory form URL",
    INVENTORY_REPORT_INTERVAL: "inventory report interval",
    NEW_ITEM_FORM_URL: "New item form URL",
    REMOVE_ITEM_FORM_URL: "Remove item form URL",
    USER_FORM_URL: "User form URL",
    WORKBOOK_URL: "Workbook URL"
};

class Settings {
    /**
     * 
     * @param {(key: string)=>Setting} getter returns the Setting for the given 
     *  key, or null if not set
     * @param {(key: string, value: any)=>any} setter assigns the given 
     *  value to the given setting
     * @param {(setting: Setting)=>any} defineSetting defines a new setting
     */
    constructor(getter, setter, defineSetting){
        this._get = getter;
        this._set = setter;
        this._define = defineSetting;
    }


    populateDefaults(){
        DEFAULT_SETTINGS.forEach(setting=>this._define(setting));
    }

    get(key){
        return this._get(key).value;
    }

    set(key, value){
        this._set(key, value);
    }

    defineSetting(key, value, description=""){
        this._define(new Setting(key, value, description));
    }

    getInventoryFormInterval(){
        return this.get(KEYS.INVENTORY_FORM_INTERVAL);
    }

    getInventoryReportInterval() {
        return this.get(KEYS.INVENTORY_REPORT_INTERVAL);
    }

    setInventoryFormStale(isStale){
        this.set(KEYS.INVENTORY_FORM_STALE, (isStale) ? "yes" : "no");
    }

    isInventoryFormStale(){
        return this.get(KEYS.INVENTORY_FORM_STALE) === "yes";
    }

    setUserForm(form){
        this.set(KEYS.USER_FORM_URL, form.getPublishedUrl());
    }

    getUserFormUrl(){
        return this.get(KEYS.USER_FORM_URL);
    }

    setInventoryForm(form){
        this.set(KEYS.INVENTORY_FORM_URL, form.getPublishedUrl());
    }

    getInventoryFormUrl(){
        return this.get(KEYS.INVENTORY_FORM_URL);
    }

    setNewItemForm(form){
        this.set(KEYS.NEW_ITEM_FORM_URL, form.getPublishedUrl());
    }

    getNewItemFormUrl(){
        return this.get(KEYS.NEW_ITEM_FORM_URL);
    }

    setRemoveItemForm(form) {
        this.set(KEYS.REMOVE_ITEM_FORM_URL, form.getPublishedUrl());
    }

    getRemoveItemFormUrl() {
        return this.get(KEYS.REMOVE_ITEM_FORM_URL);
    }

    setWorkbook(workbook){
        this.set(KEYS.WORKBOOK_URL, workbook.getUrl());
    }

    getWorkbookUrl(){
        return this.get(KEYS.WORKBOOK_URL);
    }
}


class Setting {
    constructor(name, value, description=""){
        this.name = name;
        this.value = value;
        this.description = description;
    }
}


const DEFAULT_SETTINGS = [
    new Setting(KEYS.INVENTORY_FORM_INTERVAL, 7, "The number of days between sendings of the inventory form"),
    new Setting(KEYS.INVENTORY_REPORT_INTERVAL, 7, "The number of days between sendings of the inventory report"),
    new Setting(KEYS.INVENTORY_FORM_STALE, "no", "'yes' when the system will regenerate the inventory form"),
    new Setting(KEYS.USER_FORM_URL, "", "Use this form to sign up for notifications or change your preferences"),
    new Setting(KEYS.INVENTORY_FORM_URL, "", "Use this form to update the inventory"),
    new Setting(KEYS.NEW_ITEM_FORM_URL, "", "Use this form to record a new item in the inventory"),
    new Setting(KEYS.REMOVE_ITEM_FORM_URL, "", "Use this form to remove an existing item from the inventory"),
    new Setting(KEYS.WORKBOOK_URL, "", "The URL of this workbook")
];



function testSettings(){
    const settings = new Map();
    const sut = new Settings(
        (key)=>settings.get(key),
        (key, value)=>settings.get(key).value = value,
        (setting)=>settings.set(setting.name, setting)
    );
    sut.populateDefaults();

    mustBeDefined(sut.get(KEYS.INVENTORY_FORM_INTERVAL));
}