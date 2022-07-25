/**
 * This module is responsible for services related to ProductTypes
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
    constructor(name, quantity=0, minimum=0, notificationInterval=7, lastNotified=null){
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
}


/**
 * runs all unit tests for this module, throwing an exception if any fail
 */
function testProductTypeModule(){
    testProductType();
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