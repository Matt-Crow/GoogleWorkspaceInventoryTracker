/**
 * This module is responsible for services related to ProductTypes
 * 
 * Data class: ProductType
 * #----------#--------#
 * |     name | string |
 * | quantity | int    |
 * |  minimum | int    |
 * #----------#--------#
 */



/**
 * the ProductType class represents a type of product that can be tracked by the
 * system and the various tracking parameters associated with the product
 */
class ProductType {
    /**
     * @param {string} name - an identifier for this type of product
     * @param {number} quantity - the amount of this product currently in stock 
     * @param {number} minimum - the system will report when quantity <= minimum
     * @param {number} notificationInterval - how often the stock keeper should
     *  be asked to update the quantity of this product type (measured in days)
     */
    constructor(name, quantity=0, minimum=0){
        mustHaveValue(name);
        mustHaveValue(quantity);
        mustBeNonNegative(quantity);
        mustHaveValue(minimum);
        mustBeNonNegative(minimum);

        this.name = normalizeProductTypeName(name);
        this.quantity = quantity;
        this.minimum = minimum;
    }

    dataEquals(other){
        return this.name === other.name &&
            this.quantity === other.quantity &&
            this.minimum === other.minimum;
    }

    copy(){
        return new ProductType(this.name, this.quantity, this.minimum);
    }
}



/**
 * ProductTypes are considered equal if their names are the same, ignoring case
 * 
 * @param {string} name 
 * @returns the normalized product type name
 */
function normalizeProductTypeName(name){
    return name.toLowerCase();
}

function makeInMemoryProductTypeRepository(entities=[]){
    const repo = new InMemoryRepository(
        productType => productType.name,
        name => normalizeProductTypeName(name),
        productType => productType.copy()
    );
    entities.forEach(e => repo.addEntity(e));
    return repo;
}


/**
 * The ProductTypeService handles ProductTypes business logic
 */
class ProductTypeService {
    /**
     * @param {Repository} repository stores the ProductTypes this interacts
     *  with.
     */
    constructor(repository){
        this.repository = repository;
    }

    /**
     * @returns {ProductType[]}
     */
    getAllEntities(){
        return this.repository.getAllEntities();
    }

    /**
     * @param {ProductType} product 
     */
    handleNewProduct(product){
        if(this.repository.hasEntityWithKey(product.name)){
            this.repository.update(product);
        } else {
            this.repository.addEntity(product);
        }
    }

    /**
     * @param {ProductType[]} changes 
     */
    handleLogForm(changes){
        /*
        the products created by the log form have no "minimum" field, so need to
        retrieve that field from the current repository
        */
        const oldProducts = this.repository.getAllEntities();
        const nameToProductType = new Map();
        oldProducts.forEach(product=>nameToProductType.set(product.name, product));
        changes.forEach(change=>{
            if(!nameToProductType.has(change.name)){
                console.error(`Log form contains new product: ${change.name}. Maybe regenerate the stock update form?`);
            }
            nameToProductType.get(change.name).quantity = change.quantity;
        });

        for(const changedProduct of nameToProductType.values()){
            this.repository.update(changedProduct);
        }
    }
}


/**
 * runs all unit tests for this module, throwing an exception if any fail
 */
function testProductTypeModule(){
    testProductType();
    testInMemoryProductTypeRepository();
    testProductTypeService();
}

function testProductType(){
    // any defined name is OK
    const name = "foo";
    new ProductType(name);
    assertThrows(()=>new ProductType(undefined));
    assertThrows(()=>new ProductType(null));
    
    // amount must be defined and non-negative
    const amount = 5;
    new ProductType(name, amount);
    new ProductType(name, 0);
    assertThrows(()=>new ProductType(name, null));
    assertThrows(()=>new ProductType(name, -amount));

    // minimum must be defined and non-negative
    const minimum = 3;
    new ProductType(name, amount, minimum);
    new ProductType(name, amount, 0);
    assertThrows(()=>new ProductType(name, amount, null));
    assertThrows(()=>new ProductType(name, amount, -minimum));
}

function testInMemoryProductTypeRepository(){
    const data = new ProductType("foo");
    const productTypeComparator = (a, b) => a.dataEquals(b);

    let sut = makeInMemoryProductTypeRepository();
    sut.addEntity(data);
    assertContains(data, sut._entities.values(), productTypeComparator);

    sut = makeInMemoryProductTypeRepository([data]);
    let actual = sut.getEntityByKey(data.name);
    assert(data.dataEquals(actual));

    const values = ["foo", "bar", "baz"].map(n => new ProductType(n)); 
    sut = makeInMemoryProductTypeRepository(values);
    actual = sut.getAllEntities();
    assert(3 === actual.length);
    assertContains(values[0], actual, productTypeComparator);
    assertContains(values[1], actual, productTypeComparator);
    assertContains(values[2], actual, productTypeComparator);

    sut = makeInMemoryProductTypeRepository([data]);
    let changed = data.copy();
    changed.quantity += 1;
    sut.update(changed);
    actual = sut.getEntityByKey(data.name);
    assert(changed.dataEquals(actual));
    assert(!data.dataEquals(actual));
}

function testProductTypeService(){
    const productTypeComparator = (a, b) => a.dataEquals(b);
    const exists = new ProductType("foo");
    const repo = makeInMemoryProductTypeRepository([exists]);
    const sut = new ProductTypeService(repo);
    const expected = [
        exists.copy()
    ];
    expected[0].quantity += 1;

    sut.handleLogForm(expected);
    const actual = repo.getAllEntities();

    assert(expected.length === actual.length);
    assertContains(expected[0], actual, productTypeComparator);
    assertDoesNotContain(exists, actual);
}