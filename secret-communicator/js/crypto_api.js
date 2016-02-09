
function CryptoApi() {
    //alex if you want to initliaize some stuff this is where. 
    //you can save stuff for the rest of the functions with this.yourVar = something.
}

/**
    generates public and private keys
    i dont care if string or numbers just put it like this format.
*/

CryptoApi.prototype.generateKeys = function () {
    return {"privateKey": "134" , "publicKey": "1234"}
}


/*
 * validate the message ..
 todo: alex - put some docs here
*/
CryptoApi.prototype.validateMessage =  function(signature){
    //todo: return true or false
    //todo: think. who validated that the signature contains all the correct members for the ring??

};

/*
todo: alex - put some docs here
*/
CryptoApi.prototype.signMessage =  function(message,myKeys,otherKeys,myIndex){
    //todo: return signature object.
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
