/**
 * This module is responsible for services related to Items
 * 
 * Data class: Item
 * #----------#--------#
 * |     name | string |
 * | quantity | int    |
 * |  minimum | int    |
 * #----------#--------#
 */



/**
 * the Item class represents something that can be tracked by the system
 */
class Item {
    /**
     * @param {string} name - an identifier for this type of item
     * @param {number} quantity - the amount of this item currently in stock 
     * @param {number} minimum - the system will report when quantity <= minimum
     */
    constructor(name, quantity=0, minimum=0){
        mustHaveValue(name);
        mustHaveValue(quantity);
        mustBeNonNegative(quantity);
        mustHaveValue(minimum);
        mustBeNonNegative(minimum);

        this.name = normalizeItemName(name);
        this.quantity = quantity;
        this.minimum = minimum;
    }

    dataEquals(other){
        return this.name === other.name &&
            this.quantity === other.quantity &&
            this.minimum === other.minimum;
    }

    copy(){
        return new Item(this.name, this.quantity, this.minimum);
    }
}



/**
 * Items are considered equal if their names are the same, ignoring case
 * 
 * @param {string} name 
 * @returns the normalized item name
 */
function normalizeItemName(name){
    return name.toLowerCase();
}

function makeInMemoryItemRepository(entities=[]){
    const repo = new InMemoryRepository(
        item => item.name,
        name => normalizeItemName(name),
        item => item.copy()
    );
    entities.forEach(e => repo.addEntity(e));
    return repo;
}


/**
 * The ItemService handles Items business logic
 */
class ItemService {
    /**
     * @param {Repository} repository stores the Items this interacts
     *  with.
     * @param {EmailService} emails sends emails upon receiving this inventory
     *  form.
     */
    constructor(repository, emails){
        this.repository = repository;
        this._emails = emails;
    }

    /**
     * @returns {Item[]}
     */
    getAllEntities(){
        return this.repository.getAllEntities();
    }

    /**
     * @param {Item} item 
     */
    handleNewItem(item){
        if(this.repository.hasEntityWithKey(item.name)){
            this.repository.update(item);
        } else {
            this.repository.addEntity(item);
        }
        this._emails.sendInventoryFormReply();
    }

    /**
     * @param {Item[]} changes 
     */
    handleLogForm(changes){
        /*
        the items created by the log form have no "minimum" field, so need to
        retrieve that field from the current repository
        */
        const oldItems = this.repository.getAllEntities();
        const nameToItem = new Map();
        oldItems.forEach(item=>nameToItem.set(item.name, item));
        changes.forEach(change=>{
            if(!nameToItem.has(change.name)){
                console.error(`Log form contains new item: ${change.name}. Maybe regenerate the inventory form?`);
            }
            nameToItem.get(change.name).quantity = change.quantity;
        });

        for(const changedItem of nameToItem.values()){
            this.repository.update(changedItem);
        }

        this._emails.sendInventoryFormReply();
    }
}


/**
 * runs all unit tests for this module, throwing an exception if any fail
 */
function testItemModule(){
    testItem();
    testInMemoryItemRepository();
    testItemService();
}

function testItem(){
    // any defined name is OK
    const name = "foo";
    new Item(name);
    assertThrows(()=>new Item(undefined));
    assertThrows(()=>new Item(null));
    
    // amount must be defined and non-negative
    const amount = 5;
    new Item(name, amount);
    new Item(name, 0);
    assertThrows(()=>new Item(name, null));
    assertThrows(()=>new Item(name, -amount));

    // minimum must be defined and non-negative
    const minimum = 3;
    new Item(name, amount, minimum);
    new Item(name, amount, 0);
    assertThrows(()=>new Item(name, amount, null));
    assertThrows(()=>new Item(name, amount, -minimum));
}

function testInMemoryItemRepository(){
    const data = new Item("foo");
    const itemComparator = (a, b) => a.dataEquals(b);

    let sut = makeInMemoryItemRepository();
    sut.addEntity(data);
    assertContains(data, sut._entities.values(), itemComparator);

    sut = makeInMemoryItemRepository([data]);
    let actual = sut.getEntityByKey(data.name);
    assert(data.dataEquals(actual));

    const values = ["foo", "bar", "baz"].map(n => new Item(n)); 
    sut = makeInMemoryItemRepository(values);
    actual = sut.getAllEntities();
    assert(3 === actual.length);
    assertContains(values[0], actual, itemComparator);
    assertContains(values[1], actual, itemComparator);
    assertContains(values[2], actual, itemComparator);

    sut = makeInMemoryItemRepository([data]);
    let changed = data.copy();
    changed.quantity += 1;
    sut.update(changed);
    actual = sut.getEntityByKey(data.name);
    assert(changed.dataEquals(actual));
    assert(!data.dataEquals(actual));
}

function testItemService(){
    const itemComparator = (a, b) => a.dataEquals(b);
    const exists = new Item("foo");
    const repo = makeInMemoryItemRepository([exists]);
    const emails = {
        sendInventoryFormReply: ()=>null
    };
    const sut = new ItemService(repo, emails);
    const expected = [
        exists.copy()
    ];
    expected[0].quantity += 1;

    sut.handleLogForm(expected);
    const actual = repo.getAllEntities();

    assert(expected.length === actual.length);
    assertContains(expected[0], actual, itemComparator);
    assertDoesNotContain(exists, actual);
}