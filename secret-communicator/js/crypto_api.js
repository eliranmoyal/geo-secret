
function CryptoApi() {
    //alex if you want to initliaize some stuff this is where. 
    //you can save stuff for the rest of the functions with this.yourVar = something.
}

/**
    generates public and private keys
    i dont care if string or numbers just put it like this format.
*/

CryptoApi.prototype.generateKeys = function () {
    var rsaKeySize = 512;
    var iv = Math.random().toString();

    var key = cryptico.generateRSAKey(iv, rsaKeySize);
    var myRsa = new NumericalRSA(key);
    var myTrapDoor = new TrapDoorPermutation(myRsa);

    return {"privateKey": myTrapDoor.toJson(true) , "publicKey": myTrapDoor.toJson(false)};
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

function xorStringPermutation(password, privateKeyStr) {
    var finalPassword = password;

    while (finalPassword.length < privateKeyStr.length) {
        finalPassword += password;
    }

    finalPassword = finalPassword.substr(0, privateKeyStr.length);

    var encryptedKey = "";

    for (var i = 0; i < privateKeyStr.length; i++) {
        encryptedKey += String.fromCharCode(privateKeyStr.charCodeAt(i) ^ finalPassword.charCodeAt(i));
    }

    return encryptedKey;
}

/**
encrypt and decrypt private keys.. need to think about it a little more 
how do i know if my private key decryption is correct? maby add a "correct" at the end of the key for encryption

need to use pbkdf2
password ->(need salt?) pbkdf2 -> some kind of symmetric encryption for privateKey (maby + "correct")
*/

CryptoApi.prototype.encryptKey = function(password,privateKey){
   var privateKeyStr = JSON.stringify(privateKey);
   console.log("encrypt key:" + privateKeyStr);
    return xorStringPermutation(password, privateKeyStr);
}

/**
    password -> pbkdf2 ->  symmetric to encryptedKey 
    see if result ends with "correct" - if we chose this methid
    or use the public key to sign some stuff and try to decrypt it with the privateKey
*/
CryptoApi.prototype.decryptKey = function(password,encryptedKey){
    var afterXor = xorStringPermutation(password, encryptedKey);
    try {
        return JSON.parse(afterXor);
    } catch(e) {
        return undefined;
    }
}
