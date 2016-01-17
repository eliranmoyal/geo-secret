
function afterFacebookLogin(id,tokenId){
	divToAppear = "#ring-container";
	console.log("on controller afterFacebookLogin");
	console.log ("id:" + id);
	console.log("tokenId:" + tokenId);
    $('#login-container').addClass("animated").addClass("fadeOutUpBig");
    setTimeout(function() {
      $('#login-container').remove();
      $(divToAppear).removeClass("hidden").addClass("animated").addClass("fadeInDownBig");
    }, 200);
    
}