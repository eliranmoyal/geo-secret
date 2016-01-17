  window.fbAsyncInit = function() {
    FB.init({
      appId      : '518593481648073',
      xfbml      : true,
      version    : 'v2.5'
    });
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

function statusChangeCallback(response,callback) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      getBasicInformation(callback);
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into this app.';
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into Facebook.';
    }
  }

  // This function is called when someone finishes with the Login
  // Button.  See the onlogin handler attached to it in the sample
  // code below.
  function checkLoginState(callback) {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response,callback);
    });
  }

  function getBasicInformation(callback) {
    console.log('Welcome!  Fetching your information.... ');
    var access_token = FB.getAuthResponse()['accessToken'];
    FB.api('/me', function(response) {
      callback(response.id,access_token);
      console.log('Successful login for: ' + response.name);
      var li = $('<li>');
      var img = "http://graph.facebook.com/" + response.id + "/picture?type=square";
      li.append($('<img>').attr("src",img));
      li.append(response.name);
      $('#facebook_connected_list').append(li);
      console.log(response);
      /*document.getElementById('status').innerHTML =
        'Thanks for logging in, ' + response.name + '!';*/
    });
  }
function login (callback) {
  console.log("attempting login");
  FB.login(function(response) {
    console.log("login response");
    console.log(response);
      if (response.authResponse) {
        checkLoginState(callback);
      }
    });

}
      