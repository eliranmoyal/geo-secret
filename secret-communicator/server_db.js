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
    function addNewUser(social_id, social_type, public_key, encrypted_private_key, ring){
        var params = {
            ':social_id':social_id,
            ':social_type':social_type,
            ':public_key':public_key,
            ':encrypted_private_key':encrypted_private_key,
            ':ring':ring
        };

        console.log("new user to db");
        var result = db.run("INSERT INTO users_info(social_id, social_type, public_key, encrypted_private_key, ring) VALUES (:social_id,:social_type,:public_key,:encrypted_private_key,:ring);",params);
        syncDb();

        return result;
    }

    function getRingsList(){
        var content = db.exec("SELECT DISTINCT(ring) FROM users_info");

        if (content == ''){
            return {"rings": []};
        }

        var rings_list = [];
        for( var i = 0; i< content[0].values.length; i++){
            rings_list.push(content[0].values[i][0]);
        }

        return {"rings": rings_list};
    }

    function getPublicKeysByRing(ring){

        var content = db.exec('SELECT public_key FROM users_info WHERE ring == "'+ ring + '";');

        if (content == ''){
            return {"public_keys": []};
        }

        var keys_list = [];

        for( var i = 0; i< content[0].values.length; i++){
            keys_list.push(content[0].values[i][0]);
        }

        return {"public_keys": keys_list};
    }

    function getUserInfo(social_id, social_type, ring){

        var content = db.exec('SELECT * FROM users_info WHERE social_id = "' + social_id +'" and social_type = "'+ social_type + '" and ring = "' + ring+ '";');

        if (content == ''){
            return {};
        }

        var user_info_json = "{ ";
        var len = content[0].columns.length;
        for( var i = 0; i< len; i++){
            user_info_json += '"' + content[0].columns[i] + '"' + ':"' + content[0].values[0][i] + '"';

            if ( i+1 != len){ // if not the last
                user_info_json += ',';
            }
        }

        user_info_json += " }";

        return JSON.parse(user_info_json);
    }

    function getUserRings(social_id, social_type){

        var content = db.exec('SELECT ring FROM users_info WHERE social_id = "' + social_id +'" and social_type = "'+ social_type + '";');

        if (content == ''){
            return [];
        }

        var rings = [];

        for( var i = 0; i< content[0].values.length; i++){
            rings.push(content[0].values[i][0]);
        }
        return rings;
    }

    function getUsersSocialInfoByRing(ring){

        var content = db.exec('SELECT social_id, social_type FROM users_info WHERE ring = "' + ring+ '";');


        if (content == ''){
            return {"users_info": []};
        }

        var users_info = [];

        var len = content[0].values.length;
        for( var i = 0; i< len; i++){
            var user_info_json = "{ ";
            user_info_json += '"social_id"' + ':"' + content[0].values[i][0] + '",';
            user_info_json += '"social_type"' + ':"' + content[0].values[i][1] + '"';
            user_info_json += " }";
            users_info[i] = JSON.parse(user_info_json);
        }

        return {"users_info": users_info};
    }

    return {
        init:init,
        addNewUser:addNewUser,
        getRingsList:getRingsList,
        getUserInfo:getUserInfo,
        getUserRings:getUserRings,
        getPublicKeysByRing:getPublicKeysByRing,
        getUsersSocialInfoByRing:getUsersSocialInfoByRing
    };
})();