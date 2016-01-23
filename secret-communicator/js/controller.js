
var facebookId;
var facebookToken;
function afterFacebookLogin(id,tokenId){
	
	console.log("on controller afterFacebookLogin");
	console.log ("id:" + id);
	facebookId  = id;
	facebookToken = tokenId;
	console.log("tokenId:" + tokenId);
    replaceDivs("#ring-container",'#login-container');
    setTimeout(function() {
      findChats();
    }, 200);
    
}

function replaceDivs(divToAppear,divToRemove){
    $(divToRemove).addClass("animated").addClass("fadeOutUpBig");
    setTimeout(function() {
      $(divToRemove).remove();
      $(divToAppear).removeClass("hidden").addClass("animated").addClass("fadeInDownBig");
    }, 200);

}

function findChats () {
    $.get( "/chats")
          .done(function( result ) {
            var rings = result.rings;
            for (var i = rings.length - 1; i >= 0; i--) {
                ring = rings[i];
                 var li = $('<li>');
                 var a = $('<a>');
                 a.addClass("chat_name");
                 a.attr("onClick","joinRing('" + ring +"')");
                 a.append(ring);
                 li.append(a);
                $('#chats_list').append(li);
            };
          });
}

function joinRing(ringName) {
    console.log("clicked on ring :" + ringName);
    replaceDivs("#chat-container","#ring-container");
    //todo: find ids of group - add them to list
    //call startChat
    //init encryption stuff
}

function getKey () {
	return {
		"public":"hey",
		"encrypted_private":"bye"
	};
}

$(document).ready(function(){
     $('#registerForm').submit(function (e) {
         e.preventDefault();
         console.log("register...");
         data = {};
         data["token"] = facebookToken;
         data["social_id"] = facebookId;
         data["social_type"] = "facebook";
         key = getKey();
         data["public_key"] = key.public;
         data["encrypted_private_key"] = key.encrypted_private;
         data["ring"] = $("#ring").val();
         
        $.post( "/register", data)
		  .done(function( result ) {
		    console.log( "Data Loaded: " + result );
		  });
     });
});