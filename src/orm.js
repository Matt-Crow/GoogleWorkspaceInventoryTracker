

// maybe try to abstractify this into both inmemory and gsrepo
class Repository {
    constructor(){

    }

    addEntity(entity){

    }

    hasEntityWithKey(key){

    }

    deleteEntityWithKey(key) {
        
    }
}

/**
 * stores entities in memory
 */
class InMemoryRepository {
    /**
     * 
     * @param {(e: TEntity)=>TKey} getKey maps entities to their primary key
     * @param {(key: TKey)=>TKey} formatKey for example, uppercasing names
     * @param {(e: TEntity)=>TEntity} copy used to copy entities for storage.
     *  Can return e to store argument.
     */
    constructor(getKey, formatKey, copy){
        this._entities = new Map();
        this._getKey = getKey;
        this._formatKey = formatKey;
        this._copy = copy;
    }

    addEntity(entity){
        const key = this._formatKey(this._getKey(entity));
        if(this.hasEntityWithKey(key)){
            throw new Error(`Duplicate key: ${key}`);
        }
        this._entities.set(key, this._copy(entity));
    }

    hasEntityWithKey(key){
        return this._entities.has(this._formatKey(key));
    }

    getEntityByKey(key){
        key = this._formatKey(key);
        if(!this.hasEntityWithKey(key)){
            throw new Error(`No entity with key: ${key}`);
        }
        return this._copy(this._entities.get(key));
    }

    getAllEntities(){
        return Array.from(this._entities.values()).map(e => this._copy(e));
    }

    update(entity){
        const key = this._formatKey(this._getKey(entity));
        if(!this.hasEntityWithKey(key)){
            throw new Error(`No entity with key, so cannot update: ${key}`);
        }
        this._entities.set(key, this._copy(entity));
    }

    deleteEntityWithKey(key) {
        const formattedKey = this._formatKey(key);
        if (this.hasEntityWithKey(formattedKey)) {
            this._entities.delete(formattedKey);
        }
    }
}


/**
 * stores entities in a Google sheet
 */
class GoogleSheetsRepository {
    /**
     * @param {SpreadsheetApp.Spreadsheet} sheet stores entities
     * @param {(TEntity)=>TKey} getKey extracts the primary key for an entity
     * @param {(TEntity)=>any[]} toRow converts an entity to a sheet row. The primary key must go in the first column
     * @param {(any[])=>TEntity} toEntity converts a row to an entity
     */
    constructor(sheet, getKey, toRow, toEntity){
        this._sheet = sheet;
        this._getKey = getKey;
        this._toRow = toRow;
        this._toEntity = toEntity;
    }

    addEntity(entity){
        const key = this.formatKey(this._getKey(entity));
        if(this.hasEntityWithKey(key)){
            throw new Error(`Duplicate key: ${key}`);
        }
        this._sheet.appendRow(this._toRow(entity));
    }

    formatKey(key) {
        return key.toLowerCase();
    }

    hasEntityWithKey(key){
        return this._getAllKeys().includes(this.formatKey(key));
    }

    /**
     * @returns {string[]} all the keys in the sheet, sorted by row
     */
    _getAllKeys() {
        return this._sheet
            .getRange("A2:A")
            .getValues()
            .map(row=>row[0])
            .map(cell=>this.formatKey(cell));
    }

    getEntityByKey(key){
        key = this.formatKey(key);
        if(!this.hasEntityWithKey(key)){
            throw new Error(`No entity with key: ${key}`);
        }
        const rows = this._sheet.getDataRange().getValues();
        rows.shift(); // remove header
        const idx = rows.findIndex(row => this.formatKey(row[0]) === key);
        return this._toEntity(rows[idx]);
    }

    getAllEntities(){
        const rows = this._sheet.getDataRange().getValues();
        rows.shift();
        return rows.map(row=>this._toEntity(row));
    }

    update(entity){
        const key = this.formatKey(this._getKey(entity));
        if(!this.hasEntityWithKey(key)){
            throw new Error(`No entity with key, so cannot update: ${key}`);
        }
        const rows = this._sheet.getDataRange().getValues();
        rows.shift();
        const idx = rows.findIndex(row=>this.formatKey(row[0]) === key);
        const newRow = this._toRow(entity);
        //                      translate from 0 to 1 idx, +1 for header
        this._sheet.getRange(idx + 2, 1, 1, newRow.length).setValues([newRow]);
    }

    deleteEntityWithKey(key) {
        key = this.formatKey(key);
        const arrayIdx = this._getAllKeys().findIndex((element) => this.formatKey(element) === key);
        if (arrayIdx != -1) { // entity with that key exists
            // +1 since deleteRow is 1-indexed, +1 again for header
            const rowIdx = arrayIdx + 2;
            this._sheet.deleteRow(rowIdx);
        }
    }
}