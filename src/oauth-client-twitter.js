class OAuthClientTwitter extends OAuthClient{
  constructor(opt_args){
    const params = {
      url_request_token: "https://api.twitter.com/oauth/request_token",
      url_access_token: "https://api.twitter.com/oauth/access_token",
      consumer_key: opt_args.consumer_key,
      consumer_secret: opt_args.consumer_secret,
      url_authorize: opt_args.url_authorize || "https://api.twitter.com/oauth/authorize",
      url_authorize_callback: opt_args.url_authorize_callback
    };

    super(params);
  }

  login(){
    const request4RequestToken = this._generateHTTPRequest4RequestToken();
    return this.sendHTTPRequestAsync(request4RequestToken)
    //1. get request token
    .then((result) => {
      let resParams = result.xhr.response.split("&").reduce((resParams, paramStr) => {
        let kv = paramStr.split("=");
        resParams[kv[0]] = kv[1];
        return resParams;
      }, {});
      let tokens = {
        request_token: resParams.oauth_token,
        request_token_secret: resParams.oauth_token_secret
      }

      this.setTokens(tokens);
      return this.authorizeAsync({
        oauth_token: tokens.request_token
      });
    })
    
    //2. authorize
    .then((result) => {
      this.setTokens({ oauth_verifier: result.params.oauth_verifier });
      
      const request4AccessToken = this._generateHTTPRequest4AccessToken();
      return this.sendHTTPRequestAsync(request4AccessToken);
    })
    
    //3. get access token
    .then((result) => {
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
    })
    .catch((err) => {
      throw err;
    });
  }

  _generateHTTPRequest4RequestToken(){
    if(this.params.consumer_key 
      && this.params.consumer_secret
      && this.params.url_request_token
    ){
      let method = "GET";
      let baseurl = this.params.url_request_token;
      let oauth_params = this.oauthParams.generate({
        method: method,
        url: baseurl,
        signatures:{
          consumer_secret: this.params.consumer_secret
        },
        parameters:{
          oauth_consumer_key: this.params.consumer_key,
          oauth_callback: this.params.url_authorize_callback
        }
      });

      let signed_url = `${baseurl}?${this.oauthParams._normalize(oauth_params)}`; 
      return { method: method, url: signed_url, oauth_params: oauth_params };
    }else{
      throw new Error("ChromeExtOAuth.getRequestTokenAsync requires\
                      consumer_key, consumer_secret, and url_request_token as params");
    }
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
