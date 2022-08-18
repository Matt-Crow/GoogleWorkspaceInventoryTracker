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

    getStockUpdateFormInterval(){
        return this.get("stock update form interval");
    }

    setStockUpdateLastSent(date){
        this.set("stock update form last sent", date);
    }

    getStockUpdateLastSent(){
        return this.get("stock update form last sent");
    }

    setStockUpdateFormStale(isStale){
        this.set("stock update form is stale", (isStale) ? "yes" : "no");
    }

    isStockUpdateFormStale(){
        return this.get("stock update form is stale") === "yes";
    }

    setUserForm(form){
        this.set("User form URL", form.getPublishedUrl());
    }

    getUserFormUrl(){
        return this.get("User form URL");
    }

    setStockUpdateForm(form){
        this.set("Stock update form URL", form.getPublishedUrl());
    }

    getStockUpdateFormUrl(){
        return this.get("Stock update form URL");
    }

    setNewProductTypeForm(form){
        this.set("New product type form URL", form.getPublishedUrl());
    }

    getNewProductTypeFormUrl(){
        return this.get("New product type form URL");
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
    new Setting("stock update form interval", 7, "The number of days between sendings of the stock update form"),
    new Setting("stock update form last sent", null, "When the stock update form was last sent"),
    new Setting("stock update form is stale", "no", "'yes' when the system will regenerate the stock update form"),
    new Setting("User form URL", "", "Use this form to sign up for notifications or change your preferences"),
    new Setting("Stock update form URL", "", "Use this form to update the items in stock"),
    new Setting("New product type form URL", "", "Use this form to record a new product type in the stock"),
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

    mustBeDefined(sut.get("stock update form interval"));
}