/**
 * This module is responsible for the inventory sheet created by the application
 * in its host Google Spreadsheet.
 */


/*
Google script does not guarantee the order scripts are loaded in, so this cannot
reliably extend AbstractProductTypeRepository. Thankfully, this does not rely on
any implementation details of its superclass, so this is merely a suboptimal
solution, not a wrong one.
*/
class GoogleSheetsProductTypeRepository {//extends AbstractProductTypeRepository {
    /**
     * @param {SpreadsheetApp.Sheet} sheet the "inventory" sheet of a workbook
     */
    constructor(sheet){
        //super();
        this.sheet = sheet;
    }

    addProductType(productType){
        this.sheet.appendRow([
            productType.name,
            productType.quantity,
            productType.minimum,
            productType.notificationInterval,
            productType.lastNotified
        ]);
    }

    hasProductTypeWithName(name){
        const namesInSheet = this.sheet.getRange("A2:A").getValues().map((row)=>{
            /*
            getValues() returns Object[][], so the row argument here is Object[]
            */
            return row[0]; // flattens
        }).map(normalizeProductTypeName); 
        // normalizeProductTypeNames defined in product.js

        return namesInSheet.includes(normalizeProductTypeName(name));
    }

    getProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No product type with name "${name}"`);
        }
        name = normalizeProductTypeName(name);
        const allRows = this.sheet.getDataRange().getValues();
        let row = null;
        let found = false;
        /*
        using primitive for loop so it can break out of processing once it finds
        a match instead of processing the rest of the sheet
        */
        // start at i = 1, as allRows[0] is the header row
        for(let i = 1; !found && i < allRows.length; ++i){
            row = allRows[i];
            if(normalizeProductTypeName(row[0]) === name){
                found = true;
            }
        }

        if(!found){
            /*
            if it goes here, there is likely a problem with hasProductTypeWithName
            */
            throw new Error("code should not have gotten here");
        }

        return this.convertRowToProductType(row);
    }

    convertRowToProductType(row){
        /*
        if the row was added via a call to addProductType with a ProductType
        where lastNotified === null, the value of the cell will be an empty 
        string, so this converts it back to null
        */
        const lastNotified = (row[4] === "") ? null : row[4];

        // validation handled in constructor
        const productType = new ProductType(
            row[0],
            row[1],
            row[2],
            row[3],
            lastNotified
        );

        return productType;
    }

    getAllProductTypes(){
        const allRows = this.sheet.getDataRange().getValues();
        allRows.shift(); // removes header row
        return allRows.map(this.convertRowToProductType);
    }

    updateProductType(productType){
        let data = this.sheet.getDataRange().getValues();
        let found = false;

        // skip headers
        for(let i = 1; !found && i < data.length; ++i){
            if(data[i][0] === productType.name){
                found = true;
                let newRow = [
                    productType.name, 
                    productType.quantity,
                    productType.minimum,
                    productType.notificationInterval,
                    new Date()
                ];
                this.sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
            }
        }

        if(!found){
            throw new Error(`Failed to updated ProductType with name "${productType.name}"`);
        }
    }

    deleteProductTypeByName(name){
        name = normalizeProductTypeName(name);
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No ProductType exists with name "${name}"`);
        }
        let data = this.sheet.getDataRange().getValues();
        const rowNum = data.findIndex(row => row[0] === name);
        if(rowNum === -1){
            throw new Error(`something went wrong in GoogleSheetsProductTypeRepository::deleteProductTypeByName("${name}")`);
        }
        this.sheet.deleteRow(rowNum + 1); // rowNum is 0-idx, deleteRow is 1-idx
    }

    deleteAll(){
        const lastRow = this.sheet.getLastRow();
        this.sheet.deleteRows(
            2, // skip header
            lastRow - 1 // has (lastRow) rows, so delete all but the first
        );
    }

    save(){
        
    }
}

function setupInventorySheet(workbook, namespace){
    ifSheetDoesNotExist(workbook, nameFor("inventory", namespace), name => {
        inventorySheet = workbook.insertSheet(name);
        inventorySheet.setFrozenRows(1);
        const headers = ["name", "quantity", "minimum", "notification interval", 
            "last notified"];
        const firstRow = inventorySheet.getRange(1, 1, 1, headers.length); // 1-indexed
        firstRow.setValues([headers]); // one row, which is headers
    });
}



function testGoogleSheetsProductTypeRepository(){
    const workbook = SpreadsheetApp.getActiveSpreadsheet();
    deleteWorkspace(workbook, "test");
    setupWorkspace(workbook, "test");

    const sheet = workbook.getSheetByName(nameFor("inventory", "test"));
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