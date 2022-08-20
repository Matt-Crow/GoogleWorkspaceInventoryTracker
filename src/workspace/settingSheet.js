/**
 * This module is responsible for the settings sheet created by the application
 */



function settingSheetModule(workbook, namespace){
    return new Component(
        workbook,
        namespace,
        _settingSheetNameFor,
        (ns)=>_setupSettingSheet(workbook, ns)
    );
}

function _settingSheetNameFor(namespace=""){
    return nameFor("settings", namespace);
}

function _setupSettingSheet(workbook, ns){
    const sheet = workbook.insertSheet(_settingSheetNameFor(ns));
    sheet.setFrozenRows(1);

    const headers = ["name", "value", "description"];
    sheet.appendRow(headers);

    const service = createSettings(workbook, ns);
    service.populateDefaults();
    service.setWorkbook(workbook);
}

function createSettings(workbook=null, namespace=""){
    if(workbook === null){
        workbook = SpreadsheetApp.getActiveSpreadsheet();
    }
    const sheet = workbook.getSheetByName(_settingSheetNameFor(namespace));
    const repo = _makeGoogleSheetsSettingRepository(sheet);
    const service = new Settings(
        (name) => repo.getEntityByKey(name),
        (k, v) => {
            const old = repo.getEntityByKey(k);
            const updated = new Setting(k, v, old.description);
            repo.update(updated);
        },
        (setting)=>repo.addEntity(setting)
    )
    return service;
}

function _makeGoogleSheetsSettingRepository(sheet){
    return new GoogleSheetsRepository(
        sheet,
        setting => setting.name,
        setting => [setting.name, setting.value, setting.description],
        row => new Setting(row[0], row[1], row[2])
    );
}