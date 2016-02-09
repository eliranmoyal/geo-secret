var ZERO = intToBigInteger(0);
var ONE = intToBigInteger(1);
var TWO = intToBigInteger(2);

/**
 * Converts a number to a big integer
 *
 * @param {string}  num
 * @returns {BigInteger}
 */
function intToBigInteger(num)
{
    return new BigInteger(num.toString(), 10);
}

/**
 * Returns a pow of 2 as big int
 * @param {number}  num
 * @returns {BigInteger}
 */
function powOf2(num)
{
    return TWO.pow(num)
}
