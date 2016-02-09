/**
 * Represents a ring permutation of a single number
 */
function TrapDoorPermutation(rsa)
{
    this.rsa = rsa;
    this.byteSize = 700;

    /**
     * Encrypt using ring permutation
     *
     * @param {BigInteger} num
     * @returns {BigInteger}
     */
    this.encrypt = function(num)
    {
        var n = this.rsa.key.n;

        // r = num % n
        var r = num.mod(n);
        // q = (num - r) / n
        var q = num.subtract(r).divide(n);

        // (q + 1) * n <= 2^byteSize
        if (q.add(ONE).multiply(n) <= intToBigInteger(Math.pow(2, this.byteSize))) {
            // q * n + r
            return q.multiply(n).add(this.rsa.encrypt(r));
        } else {
            return num;
        }
    }

    /**
     * Decrypt using ring permutation
     *
     * @param {BigInteger} c
     * @returns {BigInteger}
     */
    this.decrypt = function(c)
    {
        var n = this.rsa.key.n;

        // q = (c - c % n) / n
        var q = c.subtract(c.mod(n)).divide(n);

        // (q + 1) * n <= 2^byteSize
        if (q.add(ONE).multiply(n) > intToBigInteger(Math.pow(2, this.byteSize))) {
            return c;
        }

        // encryptedR = c % n
        var encryptedR = c.mod(n);
        var r = this.rsa.decrypt(encryptedR);
        // q * n + r
        return q.multiply(n).add(r);
    }

    /**
     * Serialize the trap door to a json
     * The parameter d is optional
     *
     * @param {boolean} shouldIncludePrivateKey     should the json include the private key
     * @returns {{n: string, e: number, byteSize: number, d: string}}
     */
    this.toJson = function(shouldIncludePrivateKey)
    {
        var ret = {"n" : this.rsa.key.n.toString(),
                "e" : this.rsa.key.e,
                "byteSize" : this.byteSize}

        if (shouldIncludePrivateKey) {
            ret["d"] = this.rsa.key.d.toString();
        }

        return ret;
    }
}

/**
 * Deserialize the trap door from a json
 * The parameter d is optional
 *
 * @param {{n: string, e: number, byteSize: number, d: string}}    json
 * @returns {TrapDoorPermutation}
 */
function trapDoorFromJson(json)
{
    var key = new RSAKey();
    key.n = new BigInteger(json.n, 10);
    key.e = json.e;

    if (json.d != undefined) {
        key.d = new BigInteger(json.d, 10);
    }

    var rsa = new NumericalRSA(key);
    var trapDoor = new TrapDoorPermutation(rsa, json.byteSize);

    return trapDoor;
}