/* set synonym link between a basic oauth keyword and a providor-specific keyword
 
 * @param {Object} params
 *   "url_request_token" {String}
 *   "url_authorize" {String}
 *   "url_access_token" {String}
 *   "consumer_key" {String} given by user
 *   "consumer_secret" {String} given by user
 *   "url_authorize_callback" {String} given by user
 */

class OAuthClient{
  constructor(params={}){
    this.setParams(params);
    this.oauthParams = new OAuthParams();
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
  setTokens(tokens){ 
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
  sendHTTPRequestAsync(req) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onload = (data) => {
        if(xhr.readyState === 4) resolve({ xhr: xhr, data: data });
      };
      xhr.onerror = reject;
      xhr.open(req.method, req.url, true);
      if (req.headers) {
        Object.keys(req.headers).forEach((header) => {
          xhr.setRequestHeader(header, req.headers[header]);
        });
      }
      xhr.send(req.body);
    });
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
        let handleAuthorizeCallback = this._handleAuthorizeCallback.bind(this);
        chrome.tabs.onUpdated.addListener(handleAuthorizeCallback);
        //* add listener for callback handling end
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if(request.type === "authorize"){
            //* remove listener when process finised
            chrome.tabs.onUpdated.removeListener(handleAuthorizeCallback);
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

  _handleAuthorizeCallback(tabId, changeInfo, tab){
    let urlobj = urlString2Object(tab.url);
    if(urlobj.baseurl === this.params.url_authorize_callback){
      if(!this.authorize_end){
        this.authorize_end = true;
        chrome.tabs.remove(tabId);
        chrome.runtime.sendMessage({ type:"authorize", data: urlobj });
      }
    }else{
      //nothing to do 
    }
  }
}

function urlString2Object(urlstr){
  let urlobj = {};
  let urlparts = urlstr.split("?");
  urlobj.baseurl = urlparts[0];
  if(urlparts.length > 1){
    let paramStrs = urlparts[1].split("&");
    urlobj.params = paramStrs.reduce((params, paramStr) => {
      let kv = paramStr.split("=");
      params[kv[0]] = kv[1];
      return params;
    }, {});
  }
  return urlobj;
}
