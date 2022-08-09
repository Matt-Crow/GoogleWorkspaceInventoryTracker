/**
 * This module is responsible for the inventory sheet created by the application
 * in its host Google Spreadsheet.
 */



/**
 * @param {string|undefined} namespace
 * @returns {ProductTypeService} an instance of ProductTypeService backed by a Google sheet as its
 *  repository
 */
function createProductService(namespace=""){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = workbook.getSheetByName(_inventorySheetNameFor(namespace));
    const repo = new GoogleSheetsProductTypeRepository(sheet);
    const service = new ProductTypeService(repo);
    return service;
}


class GoogleSheetsProductTypeRepository {
    /**
     * @param {SpreadsheetApp.Sheet} sheet the "inventory" sheet of a workbook
     */
    constructor(sheet){
        this.sheet = sheet;
    }

    addProductType(productType){
        this.sheet.appendRow(this._productTypeToRow(productType));
    }

    _productTypeToRow(productType){
        return [productType.name, productType.quantity, productType.minimum];
    }

    hasProductTypeWithName(name){
        const namesInSheet = this.sheet.getRange("A2:A").getValues().map((row)=>{
            /*
            getValues() returns Object[][], so the row argument here is Object[]
            */
            return row[0]; // flattens
        }).map(normalizeProductTypeName);
        return namesInSheet.includes(normalizeProductTypeName(name));
    }

    getProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No product type with name "${name}"`);
        }

        name = normalizeProductTypeName(name);
        const allRows = this.sheet.getDataRange().getValues();
        allRows.shift(); // remove header
        
        const idx = allRows.findIndex(row => normalizeProductTypeName(row[0]) === name);

        if(-1 === idx){
            throw new Error("code should not have gotten here");
        }

        return this.convertRowToProductType(allRows[idx]);
    }

    convertRowToProductType(row){
        // validation handled in constructor
        return new ProductType(
            row[0],
            row[1],
            row[2]
        );
    }

    getAllProductTypes(){
        const allRows = this.sheet.getDataRange().getValues();
        allRows.shift(); // removes header row
        return allRows.map(this.convertRowToProductType);
    }

    updateProductType(productType){
        let data = this.sheet.getDataRange().getValues();
        data.shift(); // remove headers
        
        const idx = data.findIndex(row => normalizeProductTypeName(row[0]) === productType.name);

        if(-1 === idx){
            throw new Error(`Failed to updated ProductType with name "${productType.name}"`);
        }

        const newRow = this._productTypeToRow(productType);
        //                        translate from 0-idx to 1-idx, +1 for header
        this.sheet.getRange(idx + 2, 1, 1, newRow.length).setValues([newRow]);
    }
}


function inventorySheetModule(workbook, namespace){
    return new Component(
        workbook, 
        namespace, 
        _inventorySheetNameFor,
        (ns)=>_setupInventorySheet(workbook, ns)
    );
}

function _inventorySheetNameFor(namespace){
    return nameFor("inventory", namespace);
}

function _setupInventorySheet(workbook, namespace){
    inventorySheet = workbook.insertSheet(_inventorySheetNameFor(namespace));
    inventorySheet.setFrozenRows(1);

    const validation = SpreadsheetApp.newDataValidation()
        .requireNumberGreaterThanOrEqualTo(0)
        .setAllowInvalid(false)
        .setHelpText("Quantity and minimum must both be a number at least 0")
        .build();
    const quantityAndMinimumColumns = inventorySheet.getRange("B2:C");
    quantityAndMinimumColumns.setDataValidation(validation);

    const headers = ["name", "quantity", "minimum"];
    inventorySheet.appendRow(headers);
}


function testGoogleSheetsProductTypeRepository(){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    deleteWorkspace(workbook, "test");
    setupWorkspace(workbook, "test");

    const sheet = workbook.getSheetByName(_inventorySheetNameFor("test"));
    const sut = new GoogleSheetsProductTypeRepository(sheet)
    const expected = new ProductType("product");

    sut.addProductType(expected);
    assert(sut.hasProductTypeWithName(expected.name));
    assert(!sut.hasProductTypeWithName("not " + expected.name));

    const actual = sut.getProductTypeByName(expected.name);
    assert(expected.dataEquals(actual));

    const all = sut.getAllProductTypes();
    assert(1 === all.length, `length should be 1, not ${all.length}`);
    assert(expected.dataEquals(all[0]));

    /*
    only remove test sheets if tests are successful, as this allows us to
    diagnose errors if one of these tests fails
    */
    deleteWorkspace(workbook, "test");
}