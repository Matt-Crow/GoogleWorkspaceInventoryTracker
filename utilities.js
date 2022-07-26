/**
 * This module contains miscillaneous utilities.
 * 
 * void assert(boolean)
 * void assertThrows(void function())
 * void assertContains(T, T[], boolean function(T, T))
 * void assertDoesNotContain(T, T[], boolean function(T, T))
 * 
 * void mustBeNonNegative(number)
 * void mustBePositive(number)
 * 
 * void mustBeDefined(*)
 * void mustHaveValue(*)
 */

function assert(bool){
    if(!bool){
        throw new Error();
    }
}

function assertThrows(fn){
    let anExceptionWasThrown = false;
    try {
        fn();
    } catch(ex){
        anExceptionWasThrown = true;
    }
    if(!anExceptionWasThrown){
        throw new Error("Function failed to throw an error");
    }
}

function assertContains(item, collection, comparator=(a, b)=>a===b){
    if(!Array.from(collection).some((curr)=>comparator(curr, item))){
        throw new Error(`${collection} does not contain ${item}`);
    }
}

function assertDoesNotContain(item, collection, comparator=(a, b)=>a===b){
    if(Array.from(collection).some((curr)=>comparator(curr, item))){
        throw new Error(`${collection} does contains ${item}`);
    }
}


function mustBePositive(num){
    if(num <= 0){
        throw new Error(`Value must be positive: ${num}`);
    }
}

function mustBeNonNegative(num){
    if(num < 0){
        throw new Error(`Value must be non-negative: ${num}`);
    }
}


function mustBeDefined(obj){
    if(undefined === obj){
        throw new Error("Value cannot be undefined");
    }
}

function mustHaveValue(obj){
    mustBeDefined(obj)
    if(null === obj){
        throw new Error("Value cannot be null");
    }
}