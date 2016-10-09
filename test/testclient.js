//NOTE: use dotenv to manage consumer_key and consumer_secret
//write then in your own .env file

require("dotenv").config();
const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const request_token = process.env.REQUEST_TOKEN;
const request_token_secret = process.env.REQUEST_TOKEN_SECRET;
const oauth_verifier = process.env.OAUTH_VERIFIER;
const access_token = process.env.REQUEST_TOKEN;
const access_token_secret = process.env.REQUEST_TOKEN_SECRET;

const request = require("request");

//load AuthHeader
global.AuthHeader = require("../lib/auth-header.js");
const ChromeExtOAuth = require("../lib/chrome-ext-oauth.js");

class ChromeExtOauthTest extends ChromeExtOAuth{
  constructor(){
    //サービスによって名称が異なる可能性がある
    //twitterの場合は以下の通り
    super();
    
    const synonyms = {
      request_token: "oauth_token",
      request_token_secret: "oauth_token_secret",
      oauth_verifier: "oauth_verifier",
      access_token: "oauth_token",
      access_token_secret: "oauth_token_secret",
    };

    const params = {
      url_request_token: "https://api.twitter.com/oauth/request_token",
      url_access_token: "https://api.twitter.com/oauth/access_token",
      consumer_key: consumer_key,
      consumer_secret: consumer_secret,
      url_authorize_callback: "http://localhost:8000/oauth/callback"
    };

    const tokens = {
      request_token: request_token,
      request_token_secret: request_token_secret,
      oauth_verifier: oauth_verifier,
      access_token: access_token,
      access_token_secret: access_token_secret,
    }

    this.setSynonyms(synonyms);
    this.setParams(params);
    this.setTokens(tokens);
  }

  getRequestTokenTest(){
    const req = this._generateHTTPRequest4RequestToken();
    return this.getTokenTest(req);
  }

  getAccessTokenTest(){
    const req = this._generateHTTPRequest4AccessToken();
    return this.getTokenTest(req);
  }

  getTokenTest(req){
    return new Promise((resolve, reject) => {
      request(req, (err, res, body) => {
        if(err) reject(err);
        else resolve({ res:res, body: body });
      });
    });
  }
}

const testClient = new ChromeExtOauthTest();
testClient.getRequestTokenTest()
.then((result) => { console.log(result); })
.catch((error) => { console.log(error); });
