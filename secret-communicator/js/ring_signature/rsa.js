/**
 * Represents a RSA encryption of a single number
 */
function NumericalRSA(key)
{
    this.key = key;

    /**
     * Encrypts a given number
     *
     * @param {BigInteger} num
     * @returns {BigInteger}
     */
    this.encrypt = function(num)
    {
        var bigIntE = intToBigInteger(this.key.e);

        // return num^e % n
        return num.modPow(bigIntE, this.key.n);
    }

    /**
     * Decrypts a cipher
     *
     * @param {BigInteger} c
     * @returns {BigInteger}
     */
    this.decrypt = function(c)
    {
        // return c^d % n
        return c.modPow(this.key.d, this.key.n);
    }
}
