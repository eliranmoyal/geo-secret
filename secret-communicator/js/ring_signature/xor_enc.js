/**
 * Encrypt or decrypt the number with the given key
 * @param {BigInteger}  num
 * @param {BigInteger}  key
 * @returns {BigInteger}
 */
function xorPermutation(num, key)
{
    var numSize = num.toString(2).length
    var keyLength = key.toString(2).length
    var finalKeyStr = key.toString(2)

    while(keyLength < numSize) {
         keyLength += key.toString(2).length
        finalKeyStr += key.toString(2)
    }

    finalKeyStr = finalKeyStr.slice(0, numSize - 1)

    var finalKey = new BigInteger(finalKeyStr, 2)

    return num.xor(finalKey)
}

