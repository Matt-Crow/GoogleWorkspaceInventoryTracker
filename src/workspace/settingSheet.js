/**
 * This module is responsible for the settings sheet created by the application
 */



function settingSheetModule(workspace=null){
    workspace = Workspace.currentOr(workspace);
    return new Component(
        workspace,
        _settingSheetNameFor,
        ()=>_setupSettingSheet(workspace) // not just _setupSettingSheet
    );
}

function _settingSheetNameFor(namespace=""){
    return nameFor("settings", namespace);
}

function _setupSettingSheet(workspace){
    const name = _settingSheetNameFor(workspace.namespace);
    const sheet = workspace.workbook.insertSheet(name);
    sheet.setFrozenRows(1);

    const headers = ["name", "value", "description"];
    sheet.appendRow(headers);

    const service = createSettings(workspace);
    service.populateDefaults();
    service.setWorkbook(workspace.workbook);
}

function createSettings(workspace=null){
    workspace = Workspace.currentOr(workspace);
    const name = _settingSheetNameFor(workspace.namespace);
    const sheet = workspace.workbook.getSheetByName(name);
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