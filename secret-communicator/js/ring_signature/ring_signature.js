/**
 * Represents a ring signature
 * @param {string}                  message
 * @param {BigInteger}              v
 * @param {TrapDoorPermutation[]}   trapDoors
 * @param {BigInteger[]}            randVals
 * @param {BigInteger[]}            encryptedVals
 * @constructor
 */
function RingSignature(message, v, trapDoors, randVals, encryptedVals)
{
    this.message = message;
    this.v = v;
    this.trapDoors = trapDoors;
    this.randVals = randVals;
    this.encryptedVals = encryptedVals;

    /**
     * Serializes the signature as json
     *
     * @returns {{message: string, v: string, trapDoors: TrapDoorPermutation[], randVals: string[], encryptedVals: string[]}}
     */
    this.toJson = function()
    {
        var trapDoors = [];
        var randVals = [];
        var encryptedVals = [];

        for (var i = 0; i < this.trapDoors.length; i++) {
            trapDoors.push(this.trapDoors[i].toJson());
            randVals.push(this.randVals[i].toString());
            encryptedVals.push(this.encryptedVals[i].toString());
        }

        return {"message": this.message,
                "v": this.v.toString(),
                "trapDoors": trapDoors,
                "randVals": randVals,
                "encryptedVals": encryptedVals
        };
    }
}

AES_KEY_SIZE = 64;

/**
 * Deserializes a signature json to a signature object
 * @param json
 */
function ringSignatureFromJson(json)
{
    var trapDoors = [];
    var randVals = [];
    var encryptedVals = [];

    for (var i = 0; i < json.trapDoors.length; i++) {
        trapDoors.push(trapDoorFromJson(json.trapDoors[i]));
        randVals.push(new BigInteger(json.randVals[i], 10));
        encryptedVals.push(new BigInteger(json.encryptedVals[i], 10));
    }

    return new RingSignature(json.message,
        new BigInteger(json.v, 10),
        trapDoors,
        randVals,
        encryptedVals);
}

/**
 * Create an array of all the trap doors including ours in the correct order
 *
 * @param {TrapDoorPermutation}     myTrapDoor
 * @param {number}                  myIndex
 * @param {TrapDoorPermutation[]}   othersTrapDoor
 */
function createArrayOfAllTrapDoors(myTrapDoor, myIndex, othersTrapDoor)
{
    var ret = [];

    for(var i=0; i < othersTrapDoor.length; i++) {
        if (myIndex == i) {
            ret.push(myTrapDoor);
        }
        ret.push(othersTrapDoor[i]);
    }

    if (myIndex == othersTrapDoor.length) {
        ret.push(myTrapDoor);
    }


    return ret;
}

/**
 * Generates a random number between 0 and 2^(byteSize-1)
 * @param {number} byteSize
 */
function generateRandomOfSize(byteSize)
{
    var ret = ZERO;

    for (var i = 0; i < byteSize - 1; i++) {
        var currBit = ((Math.random() < 0.5) ? ONE : ZERO);
        ret = ret.multiply(TWO).add(currBit);
    }

    return ret;
}

/**
 * Calculates the chain of encryptions for the nums
 *
 * @param {BigInteger}      v       The random value
 * @param {BigInteger}      hash    Hash of message
 * @param {BigInteger[]}    nums    Array on humbers used in the chain
 * @returns {BigInteger}
 */
function calcChainOfEncryptions(v, hash, nums)
{
    var ret = v;

    for (var i = 0; i < nums.length; i++) {
        // ret = E_k(ret xor num[i])
        ret = xorPermutation(nums[i].xor(ret), hash);
    }

    return ret;
}

/**
 * Calculates the chain of decryptions for the nums
 *
 * @param {BigInteger}      v       The random value
 * @param {BigInteger}      hash    Hash of message
 * @param {BigInteger[]}    nums    Array on humbers used in the chain
 * @returns {BigInteger}
 */
function calcChainOfDecryptions(v, hash, nums)
{
    var ret = v;

    for (var i = nums.length - 1; i >= 0; i--) {
        // ret = E_k^-1(ret) xor num[i]
        ret = xorPermutation(ret, hash).xor(nums[i]);
    }

    return ret;
}

/**
 * Calculate the byte size for the trap doors
 *
 * @param {NumericalRSA}     myRsa
 * @param {NumericalRSA[]}   othersRsa
 */
function getRingByteSize(myRsa, othersRsa)
{
    var maxN = myRsa.key.n;

    for (var i = 0; i < othersRsa.length; i++) {
        if (maxN < othersRsa[i].key.n) {
            maxN = othersRsa[i].key.n;
        }
    }

    return maxN.bitLength() + 160;
}

/**
 * Signs the given message with a ring signature
 *
 * @param {string}                  message
 * @param {TrapDoorPermutation}     myTrapDoor
 * @param {number}                  myIndex
 * @param {TrapDoorPermutation[]}   othersTrapDoor
 */
function sign(message, myTrapDoor, myIndex, othersTrapDoor)
{
    var hash = calcSha1(message);
    var byteSize = myTrapDoor.byteSize;
    var allTrapDoors = createArrayOfAllTrapDoors(myTrapDoor, myIndex, othersTrapDoor);
    var v = generateRandomOfSize(byteSize);

    var randVals = [];
    var encryptedVals = [];

    for (var i = 0; i < allTrapDoors.length; i++) {
        // If it's our index, then we want to later close the ring with them,
        // so we add 0's in the meantime
        if (i == myIndex) {
            randVals.push(0);
            encryptedVals.push(0);
        } else {
            var randX = generateRandomOfSize(byteSize);
            randVals.push(randX);
            encryptedVals.push(allTrapDoors[i].encrypt(randX));
        }
    }

    // Calculate our randVal and encryptedVal
    encryptedVals[myIndex] = calcChainOfEncryptions(v, hash, encryptedVals.slice(0, myIndex)).
        xor(xorPermutation(calcChainOfDecryptions(v, hash, encryptedVals.slice(myIndex + 1)), hash));

    randVals[myIndex] = myTrapDoor.decrypt(encryptedVals[myIndex]);

    var ret = new RingSignature(message, v, allTrapDoors, randVals, encryptedVals);
    return ret;
}

/**
 * Validate the signature of a message
 * @param {RingSignature}   signature
 * @returns {boolean}
 */
function validateSign(signature)
{
    console.log("RING_SIGNATURE -- inside validateSign");
    console.log(signature);
    var hash = calcSha1(signature.message);

    for (var i = 0; i < signature.trapDoors.length; i++) {
        if (! signature.trapDoors[i].encrypt(signature.randVals[i]).equals(signature.encryptedVals[i])) {
            alert("Wrong rand value / it's encryption");
            return false;
        }
    }

    if (! calcChainOfEncryptions(signature.v, hash, signature.encryptedVals).equals(signature.v)) {
        alert("Ring signature is incorrect");
        return false;
    }

    return true;
}