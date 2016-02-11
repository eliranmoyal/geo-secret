/**
 * Created by Hila on 06/01/2016.
 */

/**
 * This module is in use for the server as a local db.
 */

module.exports =  (function() {
    var fs = require('fs');
    var sql = require('./js/sql.js');
    var dbFileName = 'test3.sqlite';
    var db;

    /**
     * Initialized the table in the db.
     */
    function init(){
        if (fs.existsSync(dbFileName)) {
             var filebuffer = fs.readFileSync(dbFileName);
             db = new sql.Database(filebuffer);
        }
        else {
            db = new sql.Database();
            db.run("CREATE TABLE users_info (index_on_ring INT, social_id char(20), social_type char(20), public_key TEXT,encrypted_private_key TEXT, ring TEXT);");
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

    /**
     * Returns the next index in a given ring
     * @param ring
     * @returns {number}
     */
    function getNextIndexForRing(ring){

        var idx = 0;

        // Get the last index of the ring
        var content = db.exec("SELECT max(index_on_ring) as idx FROM users_info WHERE ring = '" + ring + "';");
        if (content[0].values[0][0] != null){
            idx = content[0].values[0][0] + 1;
        }

        console.log(ring + " next idx: " + idx);
        return idx;
    }

    /**
     *
     * @param social_id
     * @param social_type
     * @param public_key
     * @param encrypted_private_key
     * @param ring
     * @returns {*}
     */
    function addNewUser(social_id, social_type, public_key, encrypted_private_key, ring){

        var idx = getNextIndexForRing(ring.toLowerCase());

        var params = {
            ':index_on_ring':idx,
            ':social_id':social_id,
            ':social_type':social_type,
            ':public_key':public_key,
            ':encrypted_private_key':encrypted_private_key,
            ':ring':ring.toLowerCase()
        };

        console.log("new user to db");
        var result = db.run("INSERT INTO users_info(index_on_ring, social_id, social_type, public_key, encrypted_private_key, ring) VALUES (:index_on_ring, :social_id,:social_type,:public_key,:encrypted_private_key,:ring);",params);
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

        var content = db.exec('SELECT public_key FROM users_info WHERE ring = "'+ ring + '" ORDER BY index_on_ring;');

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

        var content = db.exec('SELECT distinct(ring) FROM users_info WHERE social_id = "' + social_id +'" and social_type = "'+ social_type + '";');

        if (content == ''){
            return [];
        }

        var rings = [];

        for( var i = 0; i< content[0].values.length; i++){
            rings.push(content[0].values[i][0].trim());
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
        getUsersSocialInfoByRing:getUsersSocialInfoByRing,
        getNextIndexForRing:getNextIndexForRing
    };
})();