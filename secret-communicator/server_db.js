/**
 * Created by Hila on 06/01/2016.
 */


module.exports =  (function() {
    var fs = require('fs');
    var sql = require('./js/sql.js');
    var dbFileName = 'test3.sqlite';
    var db;
    function init(){
        if (fs.existsSync(dbFileName)) {
             var filebuffer = fs.readFileSync(dbFileName);
             db = new sql.Database(filebuffer);
        }
        else {
            db = new sql.Database();
            db.run("CREATE TABLE users_info (social_id char(20), social_type char(20), public_key TEXT,encrypted_private_key TEXT, ring TEXT);");
            var data = db.export();
            var buffer = new Buffer(data);
            fs.writeFileSync(dbFileName, buffer);
        }
    
    }

    function syncDb () {
        var data = db.export();
        var buffer = new Buffer(data);
        fs.writeFileSync(dbFileName, buffer);
    }
    function addNewUser(social_id, social_type, public_key, ring){
        var params = {
            ':social_id':social_id,
            ':social_type':social_type,
            ':public_key':public_key,
            ':ring':ring
        }
         db.run("INSERT INTO users_info(social_id, social_type, public_key, ring) VALUES (:social_id,:social_type,:public_key,:ring);",params);
        syncDb();
        
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