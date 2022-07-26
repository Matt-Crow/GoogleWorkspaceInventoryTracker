/**
 * This module is responsible for services related to 
 * 
 * Data class: ProductType
 * #----------------------#--------#
 * |                 name | string |
 * |             quantity | int    |
 * |              minimum | int    |
 * | notificationInterval | int    |
 * |         lastNotified | Date?  |
 * #----------------------#--------#
 */



const DEFAULT_NOTIFICATION_INTERVAL = 7; // measured in days


/**
 * the ProductType class represents a type of product that can be tracked by the
 * system and the various tracking parameters associated with the product
 */
class ProductType {
    /**
     * While this constructor can be called directly, it usually preferable to
     * use the ProductTypeBuilder
     * 
     * @param {string} name - an identifier for this type of product
     * @param {number} quantity - the amount of this product currently in stock 
     * @param {number} minimum - the system will report when quantity <= minimum
     * @param {number} notificationInterval - how often the stock keeper should
     *  be asked to update the quantity of this product type (measured in days)
     * @param {Date} lastNotified - the last time quantity was updated 
     */
    constructor(name, quantity=0, minimum=0, notificationInterval=DEFAULT_NOTIFICATION_INTERVAL, lastNotified=null){
        mustHaveValue(name);
        mustHaveValue(quantity);
        mustBeNonNegative(quantity);
        mustHaveValue(minimum);
        mustBeNonNegative(minimum);
        mustHaveValue(notificationInterval);
        mustBePositive(notificationInterval);

        this.name = name;
        this.quantity = quantity;
        this.minimum = minimum;
        this.notificationInterval = notificationInterval;
        this.lastNotified = lastNotified;
    }

    equals(other){
        return this.name === other.name &&
            this.quantity === other.quantity &&
            this.minimum === other.quantity &&
            this.notificationInterval === other.notificationInterval &&
            this.lastNotified === other.lastNotified
    }

    copy(){
        return new ProductType(
            this.name, 
            this.quantity, 
            this.minimum, 
            this.notificationInterval, 
            this.lastNotified
        );
    }
}


/**
 * utilizes immutable builder design pattern: each "with____" method returns a
 * new instance of ProductTypeBuilder
 */
class ProductTypeBuilder {
    constructor(name=null, quantity=0, minimum=0, notificationInterval=DEFAULT_NOTIFICATION_INTERVAL, lastNotified=null){
        this.name = name;
        this.quantity = quantity;
        this.minimum = minimum;
        this.notificationInterval = notificationInterval;
        this.lastNotified = lastNotified;
    }

    withName(name){
        mustHaveValue(name);
        return new ProductTypeBuilder(
            name,
            this.quantity,
            this.minimum,
            this.notificationInterval,
            this.lastNotified
        );
    }

    withQuantity(quantity){
        mustBeNonNegative(quantity);
        return new ProductTypeBuilder(
            this.name,
            quantity,
            this.minimum,
            this.notificationInterval,
            this.lastNotified
        );
    }

    withMinimum(minimum){
        mustBeNonNegative(minimum);
        return new ProductTypeBuilder(
            this.name,
            this.quantity,
            minimum,
            this.notificationInterval,
            this.lastNotified
        );
    }

    withNotificationInterval(notificationInterval){
        mustBePositive(notificationInterval);
        return new ProductTypeBuilder(
            this.name,
            this.quantity,
            this.minimum,
            notificationInterval,
            this.lastNotified
        );
    }

    withLastNotified(lastNotified){
        return new ProductTypeBuilder(
            this.name,
            this.quantity,
            this.minimum,
            this.notificationInterval,
            lastNotified
        );
    }

    build(){
        return new ProductType(
            this.name,
            this.quantity,
            this.minimum,
            this.notificationInterval,
            this.lastNotified
        );
    }
}

/**
 * provides the interface for CRUD operations on ProductTypes
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
}

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
}

// TODO caching product type repo that caches in InMemory but forwards to Google


/**
 * runs all unit tests for this module, throwing an exception if any fail
 */
function testProductTypeModule(){
    testProductType();
    // TODO might want tests for ProductTypeBuilder
    testInMemoryProductTypeRepository();
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

    // notificationInterval must be defined and positive
    const notificationInterval = 3;
    new ProductType(name, amount, minimum, notificationInterval);
    assertThrows(()=>new ProductType(name, amount, minimum, 0));
    assertThrows(()=>new ProductType(name, amount, minimum, -notificationInterval));

    // no constraints of lastNotified
}

function testInMemoryProductTypeRepository(){
    const data = new ProductType("foo");

    let sut = new InMemoryProductTypeRepository();
    sut.addProductType(data);
    assertContains(data, sut.products.values(), (a, b)=>a.equals(b));

    sut = new InMemoryProductTypeRepository([data]);
    const actual = sut.getProductTypeByName(data.name);
    assert(data.equals(actual));
}