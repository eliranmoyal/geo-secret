/**
 * Created by Hila on 06/01/2016.
 */


module.exports =  (function() {

    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('users_db.sqlite');
 

    function init(){
            db.run("CREATE TABLE users_info (social_id char(20), social_type char(20), public_key TEXT, ring TEXT);",
                function  (res) {
                    console.log(res);
                });
        
    }

    function addNewUser(social_id, social_type, public_key, ring){
        var params = {
            $social_id:social_id,
            $social_type:social_type,
            $public_key:public_key,
            $ring:ring
        }
        stmt = db.prepare("INSERT INTO users_info(social_id, social_type, public_key, ring) VALUES ($social_id,$social_type,$public_key,$ring);");

        stmt.run(params, function(err) {
             if(err) {
                console.log(err);
                //callback(false);
            } else {
                console.log(this);
            }
        });
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
})();