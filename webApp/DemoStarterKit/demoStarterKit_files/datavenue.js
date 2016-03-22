/**
* Copyright (C) 2015 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
//========================================================================================================================
//
//     REQUESTS TO THE DATAVENUE SERVER
//
//========================================================================================================================

"use strict";

var _DATAVENUE = (function (){

var
  _BLANK_FUNCTION = function(){ return undefined ;},
  _url,
  _timeout,
  _X_OAPI_Key,
  _X_ISS_Key,
  _callbackError,
  _callbackRequestState ;

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

function sendRequest (request, callbackReceive, urlPath, method, json){

  _callbackRequestState (true);
  request.open (method, _url + urlPath, true);
  request.setRequestHeader ("X-OAPI-Key", _X_OAPI_Key);
  request.setRequestHeader ("X-ISS-Key", _X_ISS_Key);
  request.onreadystatechange = callbackReceive ;
  request.timeout = _timeout ;
  request.ontimeout = function () { _callbackError ("timed out request"); };
  var data ;
  if (json !== undefined){
    request.setRequestHeader ("Content-Type", "application/json");
    data = "[" + JSON.stringify (json) + "]";
  } else
    data = null ;
  request.send (data);
}

//------------------------------------------------------------------------------------------------------------------------
//  initialization
//
//  in:
//    url {string}: datavenue server url
//    timeout {unsigned long}: number of milliseconds a request can take before automatically being terminated
//    X_OAPI_Key {string}, X_ISS_Key {string}: security keys
//    callbackError (errorMessage {string}): function called in case of failure
//    callbackRequestState (ongoingRequest {boolean}): function called at the beginning and end of a request (if not undefined)
//------------------------------------------------------------------------------------------------------------------------

function init (url, timeout, X_OAPI_Key, X_ISS_Key, callbackError, callbackRequestState){

  _url = url ;
  _timeout = timeout ;
  _X_OAPI_Key = X_OAPI_Key ;
  _X_ISS_Key = X_ISS_Key ;
  _callbackError = callbackError ;
  _callbackRequestState = (callbackRequestState === undefined)? _BLANK_FUNCTION : callbackRequestState ;
}

//------------------------------------------------------------------------------------------------------------------------
//  request to get all stream identifiers
//
//  in:
//    device.datasource {string}: datasource identifier
//    callback: function called in case of success (if not undefined)
//  out:
//    device.streams.message {string}
//    device.streams.command {string}
//    device.streams.downlinkFcnt {string}
//    device.streams.battery {string}
//------------------------------------------------------------------------------------------------------------------------

function getStreams (device, callback){

  //----- reception callback

  function callbackReceive (){
  
    if (request.readyState !== 4) return ;
    try {
      if (request.status !== 200)
        throw ("wrong status");
      var response = JSON.parse (request.responseText);
      var streams = {};
      for (var i = 0; i < response.length; i++){
        var stream = response[i];
        if (stream.id === undefined)
          throw ("'id' field missing");
        if (stream.name === undefined)
          throw ("'name' field missing");
        streams[stream.name] = stream.id ;
      }
      if ((streams.message === undefined)||(streams.command === undefined)||
        (streams.downlinkFcnt === undefined)||(streams.battery === undefined))
        throw ("missing stream");
      device.streams = streams ;
      if (callback != undefined)
        callback ();
    } catch (err){
      _callbackError (err);
    } finally {
      _callbackRequestState (false);
    }
  };
  
  //----- main
  
  try {
    var request = new XMLHttpRequest();
    var urlPath = "/datasources/" + device.datasource + "/streams" ;
    sendRequest (request, callbackReceive, urlPath, "GET");
  } catch (err){
    _callbackRequestState (false);
    _callbackError (err);
  } 
};

//------------------------------------------------------------------------------------------------------------------------
//  request to get the device address
//
//  in:
//    device.datasource {string}: datasource identifier
//    callback (devAddr {string}): function called in case of success
//------------------------------------------------------------------------------------------------------------------------

function getDevAddr (device, callback){

  //----- reception callback

  function callbackReceive (){
  
    if (request.readyState !== 4) return ;
    try {
      if (request.status !== 200)
        throw ("wrong status");
      var response = JSON.parse (request.responseText);
      if (response.metadata === undefined)
        throw ("'metadata' field missing");
      var metadata = response.metadata ;     
      var devAddr ;
      for (var i = 0; i < metadata.length; i++){
        var element = metadata[i];
        if (element.key === "devaddr"){
          devAddr = element.value ;
          break ;
        }
      }
      if (devAddr === undefined)
        throw ("'devaddr' key missing");
      callback (devAddr);
    } catch (err){
      _callbackError (err);
    } finally {
      _callbackRequestState (false);
    }
  };
  
  //----- main
  
  try {  
    var request = new XMLHttpRequest();
    var urlPath = "/datasources/" + device.datasource ;
    sendRequest (request, callbackReceive, urlPath, "GET");
  } catch (err){
    _callbackRequestState (false);
    _callbackError (err);
  } 
};

//------------------------------------------------------------------------------------------------------------------------
//  initialization of all constant data for a device (stream identifiers, encryption context)
//
//  in:
//    device.datasource {string}: datasource identifier
//    appSKey {string}: AES encryption/decryption cipher application session key ("" for no encryption)
//    callback: function called in case of success (if not undefined)
//  out:
//    device.streams {object}
//    device.encryptionContext {object} (undefined if no encryption)
//------------------------------------------------------------------------------------------------------------------------

function initDevice (device, appSKey, callback){

  //----- callback 2
  
  function callback2 (devAddr){
  
    var devAddrBin = convertHexToByteArray (devAddr);    
    var appSKeyBin = convertHexToByteArray (appSKey);
    device.encryptionContext = _LPWAN_ENCRYPTION.createContext (appSKeyBin, devAddrBin);   
    if (callback !== undefined)
      callback ();
  }

  //----- callback 1
  
  function callback1 (){
  
    if ((typeof appSKey !== "string")||((appSKey.length !== 0)&&(appSKey.length !== 32)))
      throw ("wrong 'appSKey' value");
    if (appSKey.length > 0)
      getDevAddr (device, callback2);
  }

  //----- main

  getStreams (device, callback1);
}

//------------------------------------------------------------------------------------------------------------------------
//  request to get the downlink frame counter
//
//  in:
//    device {object}: device identifiers
//    callback (frameCounter {positive integer}): function called in case of success
//------------------------------------------------------------------------------------------------------------------------

function getDownlinkFrameCounter (device, callback){

  //----- reception callback

  function callbackReceive (){
  
    if (request.readyState !== 4) return ;
    try {
      if (request.status !== 200)
        throw ("wrong status");
      var response = JSON.parse (request.responseText);
      if (response.lastValue === undefined)
        throw ("'lastValue' field missing");
      var frameCounter = response.lastValue ;
      if (! isValidPositiveInt (frameCounter))
        throw ("wrong frame counter value");
      callback (frameCounter);
    } catch (err){
      _callbackError (err);
    } finally {
      _callbackRequestState (false);
    }
  };
  
  //----- main

  try {
    var request = new XMLHttpRequest();
    var urlPath = "/datasources/" + device.datasource + "/streams/" + device.streams.downlinkFcnt ;
    sendRequest (request, callbackReceive, urlPath, "GET");
  } catch (err){
    _callbackRequestState (false);
    _callbackError (err);
  } 
};

//------------------------------------------------------------------------------------------------------------------------
//  request to get the last received message
//
//  in:
//    device {object}: device identifiers, encryption context
//    callback (value {Uint8Array}, at {date}, metadata {object}): function called in case of success
//------------------------------------------------------------------------------------------------------------------------

function getLastMessage (device, callback){

  //----- reception callback

  function callbackReceive (){
  
    if (request.readyState !== 4) return ;
    try {
      if (request.status !== 200)
        throw ("wrong status");
      var response = JSON.parse (request.responseText);
      if ((!Array.isArray (response))||(response.length != 1))
        throw ("wrong response");
      var message = response[0];

      //----- metadata

      if (message.metadata === undefined)
        throw ("'metadata' field missing");
      var metadata = message.metadata ;
      if (metadata.fcnt === undefined)
        throw ("'metadata.fcnt' field missing");
        
      //----- date        

      if (message.at === undefined)
        throw ("'at' field missing");
      var at = new Date (message.at);

      //----- value

      if (message.value === undefined)
        throw ("'value' field missing");
      if (! isValidHex (message.value))
        throw ("non hexadecimal value");
      var value = convertHexToByteArray (message.value);
      if (device.encryptionContext !== undefined)     
        _LPWAN_ENCRYPTION.encryptOrDecrypt (device.encryptionContext, true, metadata.fcnt, value, value);
      
      //-----

      callback (value, at, metadata);
    } catch (err){
      _callbackError (err);
    } finally {
      _callbackRequestState (false);
    }
  }; 

  //----- main

  try {
    var request = new XMLHttpRequest();
    var urlPath = "/datasources/" + device.datasource + "/streams/" + device.streams.message +
      "/values?pagesize=1&pagenumber=1";
    sendRequest (request, callbackReceive, urlPath, "GET");  
  } catch (err){
    _callbackRequestState (false);
    _callbackError (err);
  } 
};

//------------------------------------------------------------------------------------------------------------------------
//  request to send a command
//
//  in:
//    device {object}: device identifiers, encryption context
//    value {Uint8Array}: payload
//    metadata {object}: { fcnt: ..., port: ..., confirmed: ... }
//    callback (response[0] {object}): function called in case of success
//  out:
//    value {Uint8Array}: encrypted payload
//------------------------------------------------------------------------------------------------------------------------

function sendCommand (device, value, metadata, callback){

  //----- reception callback

  function callbackReceive (){
  
    if (request.readyState !== 4) return ;
    try {
      if (request.status !== 201)
        throw ("wrong status");
      var response = JSON.parse (request.responseText);
      if ((!Array.isArray (response))||(response.length != 1))
        throw ("wrong response");
      if (callback !== undefined)
        callback (response[0]);
    } catch (err){
      _callbackError (err);
    } finally {
      _callbackRequestState (false);
    }
  }; 
  
  //----- main

  try {
    _callbackRequestState (true);
    
    //----- command

    if (! isValidPositiveInt (metadata.fcnt))
      throw ("wrong 'metadata.fcnt' value");
    if (! isValidPositiveInt (metadata.port))
      throw ("wrong 'metadata.port' value");
    if ((metadata.confirmed !== "true")&&(metadata.confirmed !== "false"))
      throw ("wrong 'metadata.confirmed' value");
    if (device.encryptionContext !== undefined)
      _LPWAN_ENCRYPTION.encryptOrDecrypt (device.encryptionContext, false, metadata.fcnt, value, value);
    var command = {
      value: convertByteArrayToHex (value),
      metadata: metadata
    }

    //-----

    var request = new XMLHttpRequest();
    var urlPath = "/datasources/" + device.datasource + "/streams/" + device.streams.command + "/values";
    sendRequest (request, callbackReceive, urlPath, "POST", command);
  } catch (err){
    _callbackRequestState (false);
    _callbackError (err);
  } 
};

//------------------------------------------------------------------------------------------------------------------------
//  public functions
//------------------------------------------------------------------------------------------------------------------------

return {
  convertHexToByteArray: convertHexToByteArray,
  convertByteArrayToHex: convertByteArrayToHex,
  init: init,
  initDevice: initDevice,
  getDownlinkFrameCounter: getDownlinkFrameCounter,
  getLastMessage: getLastMessage,
  sendCommand: sendCommand
};

})();

//========================================================================================================================

