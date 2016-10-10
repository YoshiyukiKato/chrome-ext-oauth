//NOTE: facebook does not allow sha1. use sha2
class OAuthClientFacebook extends OAuthClient{
  constructor(opt_args){
    const params = {
      url_access_token: "https://api.twitter.com/oauth/access_token",
      app_id: opt_args.consumer_key,
      app_secret: opt_args.consumer_secret,
      url_authorize: "https://www.facebook.com/v2.8/dialog/oauth",
      url_authorize_callback: opt_args.url_authorize_callback
    };

    super(params);
  }

  login(){
    const authorizeParams = let params = {
      client_id: this.params.client_id,
      redirect_url: this.params.url_authorize_callback
    };
    
    //1. authorize
    return this.authorizeAsync(authorizeParams)
        
    .then((result) => {
      this.setTokens({ oauth_verifier: result.params.oauth_verifier });
      
      const request4AccessToken = this._generateHTTPRequest4AccessToken();
      return this.sendHTTPRequestAsync(request4AccessToken);
    })
    
    //2. get access token
    .then((result) => {
      console.log(result);
      /*
      let resParams = result.xhr.response.split("&").reduce((resParams, paramStr) => {
        let kv = paramStr.split("=");
        resParams[kv[0]] = kv[1];
        return resParams;
      }, {});
      let tokens = {
        access_token: resParams.oauth_token,
        access_token_secret: resParams.oauth_token_secret
      }
      this.setTokens(tokens);
      this.user = {
        user_id: resParams.user_id,
        screen_name: resParams.screen_name
      };
      return this;
      */
    })
    .catch((err) => {
      throw err;
    });
  }

  _generateHTTPRequest4AccessToken(){
    if(this.tokens.request_token 
      && this.tokens.request_token_secret 
      && this.tokens.oauth_verifier
    ){
      let method = "GET";
      let baseurl = this.params.url_access_token;
      let headers = this.oauthParams.generate({
        method: method,
        url: baseurl,
        signatures:{
          consumer_secret: this.params.consumer_secret,
          oauth_secret: this.tokens.request_token_secret
        },
        parameters:{
          oauth_token: this.tokens.request_token,
          oauth_verifier: this.tokens.oauth_verifier
        }
      });

      let signed_url = `${baseurl}?${this.oauthParams._normalize(headers)}`; 
      return { method: method, url: signed_url };
    }else{
      throw new Error("ChromeExtOAuth.getAccessTokenAsync requires\
                      request_token, request_token_secret, and oauth_verifier as params");
    }
  }
}
