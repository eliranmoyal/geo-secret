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
        setInterval(reconnect, 30000);
    
    }

    function reconnect() {
        console.log("reconnect to pg");
        client.disconnect();
        client.connect(process.env.DATABASE_URL);
        
        client.setAutoCommit('on');
    }

    function getNextIndexForRing(ring){

        var idx = 0;

        // Get the last index of the ring
        query = "SELECT max(index_on_ring) as idx FROM users_info WHERE ring = '" + ring + "';";
        var content = client.query(query);
        
        if (content != '' && content.length != 0 ){
            if(content[0]["idx"]!=undefined && content[0]["idx"]!=null ){
                idx = content[0]["idx"] + 1;
            }
        }
        console.log(ring + " next idx: " + idx);
        return idx;
    }

    function addNewUser(social_id, social_type, public_key, encrypted_private_key, ring ){
        // Validate that the user doesn't exist at all:
        if (Object.keys(getUserInfo(social_id,social_type,ring)).length != 0){
            console.log("User already inside the ring!");
            return;
        }

        var idx = getNextIndexForRing(ring.toLowerCase());
        var params =  [social_id,social_type,public_key,ring,idx];
        var encrypted_private_key_with_escapes = "'"+encrypted_private_key.substr(1,encrypted_private_key.length-2)+"'";
        console.log("new user to db");
        insertQuery = "INSERT INTO users_info(social_id, social_type, public_key, encrypted_private_key, ring,index_on_ring) VALUES ($1,$2,$3,E"+encrypted_private_key_with_escapes+",$4,$5);";
        console.log("insertQuery:" + insertQuery);
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
        var content = client.query("SELECT public_key , encrypted_private_key FROM users_info WHERE ring = '"+ ring + "' ORDER BY index_on_ring;");
        console.log(content);   
        if (content == '' || content.length == 0){
            return {"public_keys": [] };
        }

        var public_keys_list = [];
        for( var i = 0; i< content.length; i++){
            public_keys_list.push(content[i]["public_key"]);
        }

        return {"public_keys": public_keys_list };
    }

    function getAllUsersInfo(ring) {
        var content = client.query("SELECT social_id,public_key,encrypted_private_key,index_on_ring FROM users_info WHERE ring = '" + ring+ "';"); 
        return content;       
    }

    function getUserInfo(social_id, social_type, ring){
        var content = client.query("SELECT * FROM users_info WHERE social_id = '" + social_id +"' and social_type = '"+ social_type + "' and ring = '" + ring+ "';");
        console.log(content);   
        if (content == '' || content.length == 0 || content == []){
            return {};
        }

        console.log(content[0]);

        return content[0];
    }

    function getUserRings(social_id, social_type){
        console.log("getUserRings");
        var content = client.query("SELECT distinct(ring) FROM users_info WHERE social_id = '" + social_id +"' and social_type = '"+ social_type + "';");
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
        getAllUsersInfo:getAllUsersInfo,
        getPublicKeysByRing:getPublicKeysByRing,
        getUsersSocialInfoByRing:getUsersSocialInfoByRing
    };
})();