class OAuthClientTwitter{
  constructor(opt_args){
    const params = {
      url_request_token: "https://api.twitter.com/oauth/request_token",
      url_access_token: "https://api.twitter.com/oauth/access_token"
      consumer_key: opt_args.consumer_key,
      consumer_secret: opt_args.consumer_secret,
      url_authorize: opt_args.url_authorize || "https://api.twitter.com/oauth/authorize",
      url_authorize_callback: opt_args.url_authorize_callback
    };

    super(params);
  }

  login(){
    return this.getRequestToken()
    //1. get request token
    .then((result) => {
      let resParams = result.data.body.split("&").reduce((resParams, paramStr) => {
        let kv = paramStr.split("=");
        resParams[kv[0]] = kv[1];
        return resParams;
      }, {});
      let tokens = {
        request_token: resParams.oauth_token,
        request_token_secret: resParams.oauth_token_secret
      }

      this.setTokens(tokens);
      return this.authorizeAsync();
    })
    
    //2. authorize
    .then((result) => {
      let oauth_verifier = result.params.oauth_verifier; 
      this.setToken({ oauth_verifier: oauth_verifier });
      return this.getAccessTokenAsync();
    });
    
    //3. get access token
    .then((result) => {
      let resParams = result.data.body.split("&").reduce((resParams, paramStr) => {
        let kv = paramStr.split("=");
        resParams[kv[0]] = kv[1];
        return resParams;
      }, {});
      let tokens = {
        access_token: resParams.oauth_token,
        access_token_secret: resParams.oauth_token_secret
      }
      this.setTokens(tokens);
      return this;
    })
    .catch((err) => {
      throw err;
    });
  }
}
