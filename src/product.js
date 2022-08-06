/**
 * This module is responsible for services related to ProductTypes
 * 
 * Data class: ProductType
 * #----------------------#--------#
 * |                 name | string |
 * |             quantity | int    |
 * |              minimum | int    |
 * #----------------------#--------#
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
    addProductType(productType){
        throw new Error("addProductType is not implemented");
    }

    /**
     * @param {string} name
     * @returns {boolean} whether this repository has a ProductType with the
     *  given name 
     */
    hasProductTypeWithName(name){
        throw new Error("hasProductTypeWithName is not implemented");
    }

    /**
     * retrieves the ProductType whose name matches the given name
     * subclasses are responsible for deciding how to handle getting a name for
     * which the exists no product
     * 
     * @param {string} name 
     * @returns {ProductType}
     */
    getProductTypeByName(name){
        throw new Error("getProductTypeByName is not implemented");
    }

    /**
     * @returns {ProductType[]}
     */
    getAllProductTypes(){
        throw new Error("getAllProductTypes is not implemented");
    }

    /**
     * Changes the ProductType in this repository whose name matches that of the
     * given parameter so that its data matches that of the parameter.
     * Subclasses are responsible for how to handle updating a ProductType that
     * does not exist in the repository.
     * 
     * @param {ProductType} productType 
     */
    updateProductType(productType){
        throw new Error("updateProductType is not implemented");
    }

    /**
     * Removed the ProductType with the given name from the repository.
     * Subclasses are responsible for how to handle deleting a name for which
     * there exists no ProductType.
     * 
     * @param {string} name 
     */
    deleteProductTypeByName(name){
        throw new Error("deleteProductTypeByName is not implemented");
    }

    deleteAll(){
        throw new Error("deleteAll is not implemented");
    }

    save(){
        throw new Error("save is not implemented");
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
 * This non-persistant ProductType repository can be used for testing or as a
 * cache for GoogleSheetsProductTypeRepository
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

    addProductType(productType){
        const name = normalizeProductTypeName(productType.name);
        if(this.hasProductTypeWithName(name)){
            throw new Error(`Product already exists with name "${name}"`);
        }
        this.products.set(name, productType.copy());
    }

    hasProductTypeWithName(name){
        return this.products.has(normalizeProductTypeName(name));
    }

    getProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`No product type with name "${name}"`);
        }
        return this.products.get(normalizeProductTypeName(name)).copy();
    }

    getAllProductTypes(){
        return Array.from(this.products.values()).map(pt => pt.copy());
    }

    updateProductType(productType){
        const name = normalizeProductTypeName(productType.name);
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`Cannot update product type with name "${name}", as no product with that name exists`);
        }
        this.deleteProductTypeByName(name);
        this.addProductType(productType);
    }

    deleteProductTypeByName(name){
        if(!this.hasProductTypeWithName(name)){
            throw new Error(`Cannot delete product type with name "${name}", as no product with that name exists`);
        }
        this.products.delete(normalizeProductTypeName(name));
    }

    deleteAll(){
        this.products.clear();
    }

    save(){

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
    getAllProductTypes(){
        return this.repository.getAllProductTypes();
    }

    /**
     * @param {ProductType} product 
     */
    handleNewProduct(product){
        if(this.repository.hasProductTypeWithName(product.name)){
            this.repository.updateProductType(product);
        } else {
            this.repository.addProductType(product);
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
        const oldProducts = this.repository.getAllProductTypes();
        const nameToProductType = new Map();
        oldProducts.forEach(product=>nameToProductType.set(product.name, product));
        changes.forEach(change=>{
            if(!nameToProductType.has(change.name)){
                console.error(`Log form contains new product: ${change.name}. Maybe regenerate the stock update form?`);
            }
            nameToProductType.get(change.name).quantity = change.quantity;
        });

        for(const changedProduct of nameToProductType.values()){
            this.repository.updateProductType(changedProduct);
        }
        this.repository.save();
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
    sut.addProductType(data);
    assertContains(data, sut.products.values(), productTypeComparator);

    sut = new InMemoryProductTypeRepository([data]);
    let actual = sut.getProductTypeByName(data.name);
    assert(data.dataEquals(actual));

    const values = ["foo", "bar", "baz"].map(n => new ProductType(n)); 
    sut = new InMemoryProductTypeRepository(values);
    actual = sut.getAllProductTypes();
    assert(3 === actual.length);
    assertContains(values[0], actual, productTypeComparator);
    assertContains(values[1], actual, productTypeComparator);
    assertContains(values[2], actual, productTypeComparator);

    sut = new InMemoryProductTypeRepository([data]);
    let changed = data.copy();
    changed.quantity += 1;
    sut.updateProductType(changed);
    actual = sut.getProductTypeByName(data.name);
    assert(changed.dataEquals(actual));
    assert(!data.dataEquals(actual));
}

function testProductTypeService(){
    const productTypeComparator = (a, b) => a.dataEquals(b);
    const exists = new ProductType("foo");
    const notYetAdded = new ProductType("bar");
    const repo = new InMemoryProductTypeRepository([exists]);
    const sut = new ProductTypeService(repo);
    const expected = [
        exists.copy(),
        notYetAdded
    ];
    expected[0].quantity += 1;

    sut.handleLogForm(expected);
    const actual = repo.getAllProductTypes();

    assert(expected.length === actual.length);
    assertContains(expected[0], actual, productTypeComparator);
    assertContains(expected[1], actual, productTypeComparator);
    assertDoesNotContain(exists, actual);
}