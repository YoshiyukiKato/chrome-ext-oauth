class AuthHeader{
  constructor(){
  }

  /* @param {Object} req
   *   "method" {String} GET/POST
   *   "url" {String} url
   *   "signatures" {Object}
   *     "consumer_secret" {String} required
   *     "oauth_secret" {String} request_token_secret / access_token_secret
   *   "parameters" {Object}
   *     "consumer_key" {String} required
   *     "oauth_token" {String} request_token / access_token
   *     "oauth_verifier" {String} when request access_token
   *     "signature_method" {String} default: HMAC-SHA1
   *     "url_callback" {String} for after authorize
   * @return {Object}
   *   "oauth_consumer_key {String}
   *   "oauth_token {String} if given
   *   "oauth_verifier {String} if given
   *   "oauth_signature_method {String}
   *   "oauth_callback" {String}
   *   "oauth_timestamp {Number}
   *   "oauth_nonce" {String}
   *   "oauth_signature" {String}
   *   "oauth_version" {String}
   */
  generate(req){
    let headers = {};
    if(!req.parameters.consumer_key) throw new Error("req.parameters.consumer_key is not given");
    if(!req.signatures.consumer_secret) throw new Error("req.signatures.consumer_secret is not given")
    req.parameters.signature_method = req.parameters.signature_method || "HMAC-SHA1"

    headers.oauth_consumer_key = req.parameters.consumer_key;
    headers.oauth_signature_method = req.parameters.signature_method;
    headers.oauth_timestamp = this._getTimestamp();
    headers.oauth_nonce = this._getNonce();
    if(req.parameters.url_callback){
      headers.oauth_callback = req.parameters.url_callback;
    }
    headers.oauth_signature = this._generateSignature(req, headers);
    return headers;
  }

  /* @return {Number}
  * */
  _getTimestamp() {
    return Math.floor(Date.now() / 1000);
  }
  
  /* @return {String}
  * */
  _getNonce(length) {
    const nonce_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    length = length || 5;
    let result = "";
    
    for (let i = 0; i < length; i++) {
      let rnum = Math.floor(Math.random() * nonce_chars.length);
      result += nonce_chars.substring(rnum,rnum+1);
    }
    return result;
  };

  /*
  * @param {Object} req
  * @return {String} signature
  * */
  _generateSignature(req, headers){
    let esc_consumer_secret = this._oauthEscape(req.signatures.consumer_secret)
    let esc_oauth_secret = this._oauthEscape(req.signatures.oauth_secret);
    let secretKey = `${esc_consumer_secret}&${esc_oauth_secret}`;

    if (req.parameters['signature_method'] == 'PLAINTEXT'){
      return secretKey;
    }

    if (req.parameters['signature_method'] == 'HMAC-SHA1'){
      let esc_method = this._oauthEscape(req.method);
      let esc_url = this._oauthEscape(req.url);
      let esc_norm_params = this._oauthEscape(this._normalize(headers));
      let sigString = `${esc_method}&${esc_url}&${esc_norm_params}`;

      return this._hmac_sha1(secretKey,sigString);
    }
    return null;
  }
 
  /*
  * @param {Object} parameters
  * @return {String} normalized string of parameters
  * */
  _normalize(parameters) {
    return Object.keys(parameters)
    .sort()
    .filter((paramName) => { return !(paramName.match(/\w+_secret/)); })
    .map((paramName) => {
      if(parameters[paramName] instanceof Array){
        return parameters[paramName]
        .sort()
        .map((paramValue) => { 
          let esc_paramName = this._oauthEscape(paramName);
          let esc_paramValue = this._oauthEscape(paramValue);
          return `${esc_paramName}=${esc_paramValue}`;
        })
        .join("&");
      }else{
        let esc_paramName = this._oauthEscape(paramName);
        let esc_paramValue = this._oauthEscape(parameters[paramName]);
        return `${esc_paramName}=${esc_paramValue}`;
      }
    })
    .join("&");
  }

  _oauthEscape(string) {
    if (string === undefined) {
      return "";
    }
    if (string instanceof Array){
      throw('Array passed to _oauthEscape');
    }
    return encodeURIComponent(string).replace(/\!/g, "%21")
      .replace(/\*/g, "%2A")
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
  }

  //optimized version
  _hmac_sha1(k, d, _p, _z){
    if(!_p){_p='=';}if(!_z){_z=8;}function _f(t,b,c,d){if(t<20){return(b&c)|((~b)&d);}if(t<40){return b^c^d;}if(t<60){return(b&c)|(b&d)|(c&d);}return b^c^d;}function _k(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}function _s(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}function _r(n,c){return(n<<c)|(n>>>(32-c));}function _c(x,l){x[l>>5]|=0x80<<(24-l%32);x[((l+64>>9)<<4)+15]=l;var w=[80],a=1732584193,b=-271733879,c=-1732584194,d=271733878,e=-1009589776;for(var i=0;i<x.length;i+=16){var o=a,p=b,q=c,r=d,s=e;for(var j=0;j<80;j++){if(j<16){w[j]=x[i+j];}else{w[j]=_r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}var t=_s(_s(_r(a,5),_f(j,b,c,d)),_s(_s(e,w[j]),_k(j)));e=d;d=c;c=_r(b,30);b=a;a=t;}a=_s(a,o);b=_s(b,p);c=_s(c,q);d=_s(d,r);e=_s(e,s);}return[a,b,c,d,e];}function _b(s){var b=[],m=(1<<_z)-1;for(var i=0;i<s.length*_z;i+=_z){b[i>>5]|=(s.charCodeAt(i/8)&m)<<(32-_z-i%32);}return b;}function _h(k,d){var b=_b(k);if(b.length>16){b=_c(b,k.length*_z);}var p=[16],o=[16];for(var i=0;i<16;i++){p[i]=b[i]^0x36363636;o[i]=b[i]^0x5C5C5C5C;}var h=_c(p.concat(_b(d)),512+d.length*_z);return _c(o.concat(h),512+160);}function _n(b){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s='';for(var i=0;i<b.length*4;i+=3){var r=(((b[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((b[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((b[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++){if(i*8+j*6>b.length*32){s+=_p;}else{s+=t.charAt((r>>6*(3-j))&0x3F);}}}return s;}function _x(k,d){return _n(_h(k,d));}return _x(k,d);
  }
}

//for mocha test
if(module && module.exports){
  module.exports = AuthHeader;
}
