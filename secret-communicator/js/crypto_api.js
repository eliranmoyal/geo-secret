
function CryptoApi() {
    //alex if you want to initliaize some stuff this is where. 
    //you can save stuff for the rest of the functions with this.yourVar = something.
}

/**
    generates public and private keys
    i dont care if string or numbers just put it like this format.
*/

CryptoApi.prototype.generateKeys = function () {
    var iv = Math.random().toString();

    var key = cryptico.generateRSAKey(iv, rsaKeySize);
    var myRsa = new NumericalRSA(key);
    var myTrapDoor = new TrapDoorPermutation(myRsa);

    return {"privateKey": myTrapDoor.toJson(false) , "publicKey": myTrapDoor.toJson(true)};
}


/**
 * Validate that the ring signature is correct
 *
 * @param signature {{message: string, v: string, trapDoors: TrapDoorPermutation[], randVals: string[], encryptedVals: string[]}}
 */
CryptoApi.prototype.validateMessage =  function(signature){
    return validateSign(ringSignatureFromJson(signature));

};

/**
 * Sign a message using the ring signature
 *
 * @param message       message to sign
 * @param myKey         my rsa key
 * @param otherKeys     others rsa keys
 * @param myIndex       my index with respect to the group
 * @returns {{message: string, v: string, trapDoors: TrapDoorPermutation[], randVals: string[], encryptedVals: string[]}}
 */
CryptoApi.prototype.signMessage =  function(message,myKey,otherKeys,myIndex){
    var signature = sign(message, myKey, myIndex, otherKeys)
    return signature.toJson();
}

/**
encrypt and decrypt private keys.. need to think about it a little more 
how do i know if my private key decryption is correct? maby add a "correct" at the end of the key for encryption

need to use pbkdf2
password ->(need salt?) pbkdf2 -> some kind of symmetric encryption for privateKey (maby + "correct")
*/

CryptoApi.prototype.encryptKey = function(password,privateKey){
    //todo: return encrypted key.
    return privateKey;
}

/**
    password -> pbkdf2 ->  symmetric to encryptedKey 
    see if result ends with "correct" - if we chose this methid
    or use the public key to sign some stuff and try to decrypt it with the privateKey
*/
CryptoApi.prototype.decryptKey = function(password,encryptedKey){
    //todo: decrypt key return undefined if not succedded and the key if succeeded
}
