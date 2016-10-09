const assert = require("power-assert");
const AuthHeader = require("../lib/auth-header.js");
const ah = new AuthHeader();

describe("AuthHeader", () => { 
  describe("#generate", () => {
    it("generate required headers", () => {
      const requiredHeaders = [
        "oauth_consumer_key",
        "oauth_callback",
        "oauth_signature",
        "oauth_signature_method",
        "oauth_timestamp",
        "oauth_nonce"
      ];
      const headerConfig = {
        action: "POST",
        path: "https://providor.com/oauth/request_token",
        signatures:{
          consumer_secret: "hogehogehogehoge" 
        },
        parameters:{
          consumer_key: "fugafugafugafuga",
          url_callback: "chrome-extension://piyopiyopiyo/callback.html"
        }
      }
      const headers = ah.generate(headerConfig);
      const isHeaderFullfilled = requiredHeaders.reduce((isHeaderFullfilled, requiredHeader) => {
        return !!(isHeaderFullfilled && headers[requiredHeader]);
      }, true);

      assert(isHeaderFullfilled);
    });
  });
});
