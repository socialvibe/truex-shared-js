export class AppStorage {
  // For some platform (e.g. Comcast), there is no local storage.
  // It needs to fall back using Cookie instead.

  setItem(key, value, daysValid, domain) {
    if (localStorage) {
      localStorage.setItem(key, value);
    } else {
      this._setCookieVariable(key, value, daysValid, domain);
    }
  }

  getItem(key) {
    if (localStorage) {
      return localStorage.getItem(key);
    } else {
      return this._readCookieVariable(key);
    }
  }

  removeItem(key, domain) {
    if (localStorage) {
      localStorage.removeItem(key);
    } else {
      this._deleteCookieVariable(key, domain);
    }
  }

  _setCookieVariable(name, value, daysValid, domain) {
    var expires = "";
    if (daysValid) {
      var date = new Date();
      date.setTime(date.getTime()+(daysValid*24*60*60*1000));
      expires = "; expires="+date.toGMTString();
    }
    var cookieStr = name + "=" + value + expires;
    if (domain) {
      cookieStr += "; domain=." + domain;
    }
    cookieStr += "; path=/";
    document.cookie = cookieStr;
  }

  _readCookieVariable(name) {
    name += "=";
    var cookieVars = document.cookie.split(";");
    for(var i=0; i < cookieVars.length; i++) {
      var currentVar = cookieVars[i];
      while (currentVar.charAt(0)==" ") currentVar = currentVar.substring(1);
      if (currentVar.indexOf(name) === 0) return currentVar.substring(name.length, currentVar.length);
    }
    return null;
  }

  _deleteCookieVariable(name, domain) {
    // Delete the cookie by expiring it.
    if(this._readCookieVariable(name)){
      this._setCookieVariable(name, "", -365, domain);
    }
  }
}