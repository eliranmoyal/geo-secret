/**
 * Created by Hila on 06/01/2016.
 */


module.exports =  function() {

    var sql = require('js/sql.js');
    var db = sql.Database("users_db.sqlite");

    function init(){
        try{
            db.run("CREATE TABLE users_info (social_id , social_type, public_key, ring);");
        }catch (e){
            // The table already exists
        }
    }

    function addNewUser(social_id, social_type, public_key, ring){
        db.run("INSERT INTO users_info VALUES ($('#social_id'),$('#social_type'),$('#public_key'),$('#ring'));");
    }

    function getPublicKeysByRing(ring){

        var content = db.exec("SELECT public_key FROM users_info WHERE ring = $('#ring')");
        return content;
    }

    function getUsersSocialInfoByRing(ring){

        var content = db.exec("SELECT social_id, social_type FROM users_info WHERE ring = $('#ring')");
        return content;
    }

    return {
        init:init,
        addNewUser:addNewUser,
        getPublicKeysByRing:getPublicKeysByRing,
        getUsersSocialInfoByRing:getUsersSocialInfoByRing
    };
}