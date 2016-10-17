/**
* Copyright (C) 2015 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
//========================================================================================================================
//
//     COMMON FUNCTIONS AND CONSTANTS
//
//========================================================================================================================

"use strict";

var _COMMONS = (function (){

  var
    _BLANK_FUNCTION = function(args){ 
      if(args) 
        console.error(args);
      else 
        console.error("_BLANK_FUNCTION() call");
    },
    _url,
    _timeout;

  //------------------------------------------------------------------------------------------------------------------------
  //  conversion: hexadecimal {string} to bytes {Uint8Array}
  //------------------------------------------------------------------------------------------------------------------------

  function convertHexToByteArray (hex){

    var n = hex.length / 2 ;
    var buf = new Uint8Array (n);
    var j = 0 ;
    for (var i = 0 ; i < n ; i++){
      var j2 = j + 2 ;
      buf[i] = parseInt (hex.substring (j, j2), 16);
      j = j2 ;
    }
    return buf ;
  }

  //------------------------------------------------------------------------------------------------------------------------
  //  conversion: bytes {Uint8Array} to hexadecimal {string}
  //------------------------------------------------------------------------------------------------------------------------

  function convertByteArrayToHex (buf){

    var n = buf.length ;
    var str = "";
    for (var i = 0 ; i < n ; i++){
      var b = buf[i];
      var h = b.toString (16);
      str += (b <= 15) ? ("0" + h): h ;
    }
    return str ;
  }

  //------------------------------------------------------------------------------------------------------------------------
  //  validity test for an hexadecimal number
  //------------------------------------------------------------------------------------------------------------------------

  function isValidHex (obj){
    return ((typeof obj === "string")&&(obj.match (/^([0-9a-f][0-9a-f])+$/) !== null));
  }

  //------------------------------------------------------------------------------------------------------------------------
  //  validity test for a positive integer
  //------------------------------------------------------------------------------------------------------------------------

  function isValidPositiveInt (obj){
    return ((typeof obj === "number")&&(obj >= 0));
  }

  //------------------------------------------------------------------------------------------------------------------------
  //  initialization
  //
  //  in:
  //    url {string}: datavenue server url
  //    timeout {unsigned long}: number of milliseconds a request can take before automatically being terminated
  //    callbackError (errorMessage {string}): function called in case of failure
  //    callbackRequestState (ongoingRequest {boolean}): function called at the beginning and end of a request (if not undefined)
  //------------------------------------------------------------------------------------------------------------------------

  function init (url, timeout, callbackError, callbackRequestStateRx, callbackRequestStateTx){

    _url = url ;
    _timeout = timeout ;
    _COMMONS.callbackError = (callbackError) ? callbackError : _BLANK_FUNCTION ;
    _COMMONS.callbackRequestStateRx = (callbackRequestStateRx) ? callbackRequestStateRx : _BLANK_FUNCTION ;
    _COMMONS.callbackRequestStateTx = (callbackRequestStateTx) ? callbackRequestStateTx : _BLANK_FUNCTION ;
  }

  //------------------------------------------------------------------------------------------------------------------------
  //  sends a request
  //
  //  in:
  //    callbackReceive (): function called when the request state changes
  //    urlPath {string}: variable part of the url
  //    method {string}: request method
  //    json {object}: json data to send (undefined if no data)
  //  out:
  //    request {XMLHttpRequest}: request
  //------------------------------------------------------------------------------------------------------------------------

  function sendRequest (request, callbackReceive, urlPath, headers, method, json){

    console.debug("send " + method + " " + _url + urlPath);
    
    //open REST
    request.open (method, _url + urlPath, true);
    
    //headers
    for(var key in headers){
      console.debug("HEADER: " + key + " : " + headers[key]);
      request.setRequestHeader (key, headers[key]);
    }
      
    //callback receive
    request.onreadystatechange = callbackReceive;
    //request.onerror = function(e) { _COMMONS.callbackError("sending request"); };
    
    //timeout
    request.timeout = _timeout ;
    request.ontimeout = function () { _COMMONS.callbackError("timed out request"); };
    
    //send data
    var data ;
    if (json !== undefined){
      request.setRequestHeader ("Content-Type", "application/json");
      data = JSON.stringify (json);
      console.debug("DATA: " + data);
    } else
      data = null ;
    
    request.send (data);
    
  }

  //------------------------------------------------------------------------------------------------------------------------
  //  public functions
  //------------------------------------------------------------------------------------------------------------------------

  return {
    convertHexToByteArray: convertHexToByteArray,
    convertByteArrayToHex: convertByteArrayToHex,
    isValidHex: isValidHex,
    isValidPositiveInt: isValidPositiveInt,
    init: init,
    sendRequest: sendRequest,
    callbackRequestStateTx: undefined,
    callbackRequestStateRx: undefined,
    callbackError: undefined
  };

})();

//========================================================================================================================

