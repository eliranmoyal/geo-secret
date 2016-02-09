/**
 * Calc SHA-1 on message
 * @param {string}  message
 * @returns {BigInteger}
 */
function calcSha1(message)
{
    return new BigInteger(sha1.hex(message), 16)
}