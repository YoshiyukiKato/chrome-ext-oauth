/* set synonym link between a basic oauth keyword and a providor-specific keyword
 * @param {Object} synonyms
 *  "request_token" {String}
 *  "request_token_secret" {String}
 *  "oauth_verifier" {String}
 *  "access_token" {String}
 *  "access_token_secret" {String}
 * @param {Object} params
 *   "url_request_token" {String}
 *   "url_authorize" {String}
 *   "url_access_token" {String}
 *   "consumer_key" {String} given by user
 *   "consumer_secret" {String} given by user
 *   "url_authorize_callback" {String} given by user
 */

class OAuthClient{
  constructor(synonyms={}, params={}){
    this.setSynonyms(synonyms);
    this.setParams(params);
    this.authHeader = new AuthHeader();
  }
  
  setSynonyms(synonyms){
    this._set("synonyms", synonyms); 
  }
  
  setParams(params){
    this._set("params", params);
  }

  /* @param {Object} tokens
   *   "request_token" {String}
   *   "request_token_secret" {String}
   *   "oauth_verifier" {String}
   *   "access_token" {String}
   *   "access_token_secret" {String}*/
  setToken(tokens){ 
    this._set("tokens", tokens); 
  }

  /* @param {String} propName
   * @param {Object} args 
   */
  _set(propName, args){
    this[propName] = this[propName] || {};
    Object.keys(args).forEach((argName) => {
      if(args[argName]) this[propName][argName] = args[argName];
    });
  }

  /* @param {Object} req
   *   "method" {String}
   *   "url" {String}
   *   "headers" {Object}
   *   "body" {String}
   */
  _sendHTTPRequest(req, handleSuccess, handleError) {
    let xhr = new XMLHttpRequest();
    xhr.onload = (data) => {
      if(xhr.readyState === 4) handleSuccess({ xhr: xhr, data: data });
    };
    xhr.onerror = handleError;
    xhr.open(req.method, req.url, true);
    if (headers) {
      Object.keys(req.headers).forEach((header) => {
        xhr.setRequestHeader(header, headers[header]);
      });
    }
    xhr.send(req.body);
  }

  getRequestTokenAsync(){
    return new Promise((resolve, reject) => {
      const req = this._generateHTTPRequest4RequestToken();
      this._sendHTTPRequest(req, resolve, reject);
    });
  }

  _generateHTTPRequest4RequestToken(){
    if(this.params.consumer_key 
      && this.params.consumer_secret
      && this.params.url_request_token
    ){
      let method = "GET";
      let baseurl = this.params.url_request_token;
      let headers = this.authHeader.generate({
        method: method,
        url: baseurl,
        signatures:{
          consumer_secret: this.params.consumer_secret
        },
        parameters:{
          consumer_key: this.params.consumer_key,
          url_callback: this.params.url_authorize_callback
        }
      });

      let signed_url = `${baseurl}?${this.authHeader._normalize(headers)}`; 
      return { method: method, url: signed_url, headers: headers };
    }else{
      throw new Error("ChromeExtOAuth.getRequestTokenAsync requires\
                      consumer_key, consumer_secret, and url_request_token as params");
    }
  }

  authorizeAsync(params){
    //done: get oauth_verifier
    //controlling tab
    return new Promise((resolve, reject) => {
      if(this.params.url_authorize && this.params.url_authorize_callback){  
        //* open authorize page in new tab
        let baseurl = this.params.url_authorize;
        let paramStr = Object.keys(params).map((paramName) => {
          return `${paramName}=${params[paramName]}`;
        }).join("&");
        let url = `${baseurl}?${paramStr}`;
        chrome.tabs.create({ url: url });
        //* add listener for callback page
        chrome.tabs.onUpdated.addListener(handleAuthorizeCallback);
        //* add listener for callback handling end
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if(request.type === "authorize" && request.status === "success"){
            //* remove listener when process finised
            chrome.tabs.onUpdate.removeListener(handleAuthorizeCalback);
            //* pass to next
            resolve(request.data);
          }else if(request.type === "authorize" && request.status === "error"){
            reject("required params is not given with authorize callback"); 
          }
        });
      }else{
        reject("ChromeExtOAuth.authorizeAsync requires\
               url_authorize and url_authorize_callback as params");
      }
    });
  }

  getAccessTokenAsync(){
    return new Promise((resolve, reject) => {
      const req = this._generateHTTPRequest4AccessToken();
      this._sendHTTPRequest(req, resolve, reject);
    });
  }

  _generateHTTPRequest4AccessToken(){
    if(this.tokens.request_token 
      && this.tokens.request_token_secret 
      && this.tokens.oauth_verifier
    ){
      let method = "GET";
      let baseurl = this.params.url_access_token;
      let headers = this.authHeader.generate({
        method: method,
        url: baseurl,
        signatures:{
          consumer_secret: this.params.consumer_secret,
          oauth_secret: this.tokens.request_token_secret
        },
        parameters:{
          consumer_key: this.params.consumer_key,
          oauth_token: this.tokens.request_token,
          oauth_verifier: this.tokens.oauth_verifier
        }
      });

      let signed_url = `${baseurl}?${this.authHeader._normalize(headers)}`; 
      return { method: method, url: signed_url };
    }else{
      throw new Error("ChromeExtOAuth.getAccessTokenAsync requires\
                      request_token, request_token_secret, and oauth_verifier as params");
    }
  }
  
}

function handleAuthorizeCallback(tabId, changeInfo, tab){
  let urlobj = urlString2Object(tab.url);
  if(urlobj.baseurl === this.params.url_authorize_callback){
    chrome.runtime.sendMessage({ type:"authorize", data: urlObj });
  }else{
    //nothing to do 
  }
}

function urlString2Object(urlstr){
  let urlobj = {};
  let urlparts = urlstr.split("?");
  href.baseurl = urlparts[0];
  if(urlparts.length > 1){
    let paramStrs = rulparts[1].split("&");
    href.params = paramStrs.reduce((params, paramStr) => {
      let kv = paramStr.split("=");
      params[kv[0]] = kv[1];
    }, {});
  }
  return urlobj;
}

if(module && module.exports){
  module.exports = OAuthClient;
}
