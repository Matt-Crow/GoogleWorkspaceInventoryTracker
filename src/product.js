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
 * provides the interface for CRUD operations on ProductTypes
 * 
 * because of how Google script concatinates files together, class extension
 * does not work, so this class does nothing but provide developer guidelines
 */
class AbstractProductTypeRepository {
    /**
     * records a new ProductType in the repository
     * subclasses are responsible for deciding how to handle adding a 
     * ProductType whose name is already used
     * 
     * @param {ProductType} productType 
     */
    addEntity(productType){
        throw new Error("addEntity is not implemented");
    }

    /**
     * @param {string} name
     * @returns {boolean} whether this repository has a ProductType with the
     *  given name 
     */
    hasEntityWithKey(name){
        throw new Error("hasEntityWithKey is not implemented");
    }

    /**
     * retrieves the ProductType whose name matches the given name
     * subclasses are responsible for deciding how to handle getting a name for
     * which the exists no product
     * 
     * @param {string} name 
     * @returns {ProductType}
     */
    getEntityByKey(name){
        throw new Error("getEntityByKey is not implemented");
    }

    /**
     * @returns {ProductType[]}
     */
    getAllEntities(){
        throw new Error("getAllEntities is not implemented");
    }

    /**
     * Changes the ProductType in this repository whose name matches that of the
     * given parameter so that its data matches that of the parameter.
     * Subclasses are responsible for how to handle updating a ProductType that
     * does not exist in the repository.
     * 
     * @param {ProductType} productType 
     */
    update(productType){
        throw new Error("update is not implemented");
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

/**
 * This non-persistant ProductType repository used for testing
 */
class InMemoryProductTypeRepository extends AbstractProductTypeRepository {
    constructor(products=[]){
        super();
        this.products = new Map();
        products.forEach(product => this.products.set(
            normalizeProductTypeName(product.name),
            product
        ));
    }

    addEntity(productType){
        const name = normalizeProductTypeName(productType.name);
        if(this.hasEntityWithKey(name)){
            throw new Error(`Product already exists with name "${name}"`);
        }
        this.products.set(name, productType.copy());
    }

    hasEntityWithKey(name){
        return this.products.has(normalizeProductTypeName(name));
    }

    getEntityByKey(name){
        if(!this.hasEntityWithKey(name)){
            throw new Error(`No product type with name "${name}"`);
        }
        return this.products.get(normalizeProductTypeName(name)).copy();
    }

    getAllEntities(){
        return Array.from(this.products.values()).map(pt => pt.copy());
    }

    update(productType){
        const name = normalizeProductTypeName(productType.name);
        if(!this.hasEntityWithKey(name)){
            throw new Error(`Cannot update product type with name "${name}", as no product with that name exists`);
        }
        this.products.set(name, productType);
    }
}


/**
 * The ProductTypeService handles ProductTypes business logic
 */
class ProductTypeService {
    /**
     * @param {AbstractProductTypeRepository} repository 
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

    let sut = new InMemoryProductTypeRepository();
    sut.addEntity(data);
    assertContains(data, sut.products.values(), productTypeComparator);

    sut = new InMemoryProductTypeRepository([data]);
    let actual = sut.getEntityByKey(data.name);
    assert(data.dataEquals(actual));

    const values = ["foo", "bar", "baz"].map(n => new ProductType(n)); 
    sut = new InMemoryProductTypeRepository(values);
    actual = sut.getAllEntities();
    assert(3 === actual.length);
    assertContains(values[0], actual, productTypeComparator);
    assertContains(values[1], actual, productTypeComparator);
    assertContains(values[2], actual, productTypeComparator);

    sut = new InMemoryProductTypeRepository([data]);
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
    const repo = new InMemoryProductTypeRepository([exists]);
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