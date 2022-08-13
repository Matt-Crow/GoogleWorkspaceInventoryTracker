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
        this._populateDefaults();
    }


    _populateDefaults(){
        DEFAULT_SETTINGS.forEach(setting=>this._define(setting));
    }

    get(key){
        return this._get(key).value;
    }

    set(key, value){
        this._set(key, value);
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
    new Setting("stock update form is stale", true, "'yes' when the system will regenerate the stock update form")
];



function testSettings(){
    const settings = new Map();
    const sut = new Settings(
        (key)=>settings.get(key),
        (key, value)=>settings.get(key).value = value,
        (setting)=>settings.set(setting.name, setting)
    );

    mustBeDefined(sut.get("stock update form interval"));
}