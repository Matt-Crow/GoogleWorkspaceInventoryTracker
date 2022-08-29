/**
 * This module is responsible for the the settings system the program uses.
 * Settings are essentially key-value pairs with a description attached.
 */



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
        return this.get("inventory form interval");
    }

    setInventoryFormStale(isStale){
        this.set("inventory form is stale", (isStale) ? "yes" : "no");
    }

    isInventoryFormStale(){
        return this.get("inventory form is stale") === "yes";
    }

    setUserForm(form){
        this.set("User form URL", form.getPublishedUrl());
    }

    getUserFormUrl(){
        return this.get("User form URL");
    }

    setInventoryForm(form){
        this.set("Inventory form URL", form.getPublishedUrl());
    }

    getInventoryFormUrl(){
        return this.get("Inventory form URL");
    }

    setNewItemForm(form){
        this.set("New item form URL", form.getPublishedUrl());
    }

    getNewItemFormUrl(){
        return this.get("New item form URL");
    }

    setWorkbook(workbook){
        this.set("Workbook URL", workbook.getUrl());
    }

    getWorkbookUrl(){
        return this.get("Workbook URL");
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
    new Setting("inventory form interval", 7, "The number of days between sendings of the inventory form"),
    new Setting("inventory form is stale", "no", "'yes' when the system will regenerate the inventory form"),
    new Setting("User form URL", "", "Use this form to sign up for notifications or change your preferences"),
    new Setting("Inventory form URL", "", "Use this form to update the inventory"),
    new Setting("New item form URL", "", "Use this form to record a new item in the inventory"),
    new Setting("Workbook URL", "", "The URL of this workbook")
];



function testSettings(){
    const settings = new Map();
    const sut = new Settings(
        (key)=>settings.get(key),
        (key, value)=>settings.get(key).value = value,
        (setting)=>settings.set(setting.name, setting)
    );
    sut.populateDefaults();

    mustBeDefined(sut.get("inventory form interval"));
}