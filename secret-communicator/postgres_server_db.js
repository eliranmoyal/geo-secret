/**
 * Created by Hila on 06/01/2016.
 */


module.exports =  (function() {
    var pg = require('pg-sync');
    var client;

    function init(){

        client = new pg.Client();
 
        client.connect(process.env.DATABASE_URL);
        
        client.setAutoCommit('on');
    
    }

    function addNewUser(social_id, social_type, public_key, encrypted_private_key, ring ){
        var params =  [social_id,social_type,public_key,encrypted_private_key,ring,0];
        console.log("new user to db");
        insertQuery = "INSERT INTO users_info(social_id, social_type, public_key, encrypted_private_key, ring,index_on_ring) VALUES ($1,$2,$3,$4,$5,$6);";
        var stm = client.prepare(insertQuery);
        res = stm.execute(params);

        console.log("res:" + JSON.stringify(res));
        return res;
    }

    function getRingsList(){
        console.log("getRingsList");
        var content = client.query("SELECT DISTINCT(ring) FROM users_info");
        console.log(content);
        if (content == '' || content.length == 0){
            return {"rings": []};
        }


        var rings_list = [];
        for( var i = 0; i< content.length; i++){
            rings_list.push(content[i]["ring"]);
        }

        return {"rings": rings_list};
    }

    function getPublicKeysByRing(ring){
        console.log("getPublicKeysByRing");
        var content = client.query("SELECT public_key FROM users_info WHERE ring == '"+ ring + "';");
        console.log(content);   
        if (content == '' || content.length == 0){
            return {"public_keys": []};
        }

        var keys_list = [];

        for( var i = 0; i< content.length; i++){
            keys_list.push(content[i]["public_key"]);
        }

        return {"public_keys": keys_list};
    }

    function getUserInfo(social_id, social_type, ring){
        console.log("getUserInfo");
        var content = client.query("SELECT * FROM users_info WHERE social_id = '" + social_id +"' and social_type = '"+ social_type + "' and ring = '" + ring+ "';");
        console.log(content);   
        if (content == '' || content.length == 0){
            return {};
        }

        
        return content[0];
    }

    function getUserRings(social_id, social_type){
        console.log("getUserRings");
        var content = client.query("SELECT ring FROM users_info WHERE social_id = '" + social_id +"' and social_type = '"+ social_type + "';");
        console.log(content);
        if (content == '' || content.length == 0){
            return [];
        }

        var rings = [];

        for( var i = 0; i< content.length; i++){
            rings.push(content[i]["ring"].trim());
        }
        return rings;
    }

    function getUsersSocialInfoByRing(ring){
        console.log("getUsersSocialInfoByRing");
        var content = client.query("SELECT social_id, social_type FROM users_info WHERE ring = '" + ring+ "';");
        console.log(content);

        if (content == ''){
            return {"users_info": []};
        }

        var users_info = [];

        var len = content.length;
        for( var i = 0; i< len; i++){
            users_info[i] = content[i];
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