/**
 * This module contains miscillaneous utilities.
 * 
 * void assertThrows(void function())
 * 
 * void mustBeNonNegative(number)
 * void mustBePositive(number)
 * 
 * void mustBeDefined(*)
 * void mustHaveValue(*)
 */

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