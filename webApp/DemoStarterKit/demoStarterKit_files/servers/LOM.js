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

var _LOM = (function (){

var headers;

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

function init (X_API_Key){
  headers = {"X-API-Key": X_API_Key};
}

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
        throw ("request status: " + request.status);
        
      var response = JSON.parse (request.responseText);
      if ((!Array.isArray (response))||(response.length < 1))
        throw ("wrong response: " + JSON.stringify(response));

      //----- data
      
      var message = response[0];

      if (message.value === undefined)
        throw ("'value' field missing: " + JSON.stringify(message));
        
      var value = message.value ;
      if (value.fcnt === undefined)
        throw ("'value.fcnt' field missing: " + JSON.stringify(message));
        
      //----- date   

      if (message.timestamp === undefined)
        throw ("'timestamp' field missing: " + JSON.stringify(message));
      var timestamp = new Date (message.timestamp);

      //----- value

      if (value.payload === undefined)
        throw ("'payload' field missing");
      if (! _COMMONS.isValidHex (value.payload))
        throw ("non hexadecimal payload: " + value.payload);
      var payload = _COMMONS.convertHexToByteArray (value.payload);
      
      //-----

      callback (payload, timestamp, value);
    } catch (err){
      _COMMONS.callbackError(err);
      _COMMONS.callbackRequestStateRx (false);
    }
  }; 

  //----- main

  try {
    var request = new XMLHttpRequest();
    var urlPath = "/data/streams/urn:lora:" + device.deviceID + "!uplink?limit=1";
    _COMMONS.sendRequest (request, callbackReceive, urlPath, headers, "GET");
  } catch (err){
    _COMMONS.callbackError (err);
    _COMMONS.callbackRequestStateRx (false);
  } 
};

//------------------------------------------------------------------------------------------------------------------------
//  request to send a command
//
//  in:
//    device {object}: device identifiers, encryption context
//    value {Uint8Array}: payload
//    port {uint}: transmittion port
//    confirmed {boolean}: send confirmed message
//    callback (response[0] {object}): function called in case of success
//  out:
//    value {Uint8Array}: encrypted payload
//------------------------------------------------------------------------------------------------------------------------

function sendCommand (device, value, port, confirmed, callback){

  //----- reception callback

  function callbackReceive (){
  
    if (request.readyState !== 4) return ;
    try {
      if (request.status !== 200)
        throw ("request status: " + request.status);
        
      var response = JSON.parse (request.responseText);
      
      if (callback !== undefined)
        callback (response.creationTs);
    } catch (err){
      _COMMONS.callbackError (err);
      _COMMONS.callbackRequestStateTx (false);
    }
  }; 
  
  //----- main

  try {    
    //----- command

    var command = {
      data: _COMMONS.convertByteArrayToHex (value),
      port: port,
      confirmed: confirmed
    };

    if (! _COMMONS.isValidHex (command.data))
      throw ("wrong hex value: " + command.data);
    if (! _COMMONS.isValidPositiveInt (command.port))
      throw ("wrong 'metadata.port' value: " + command.port);

    //-----

    var request = new XMLHttpRequest();
    var urlPath = "/vendors/lora/devices/" + device.deviceID + "/commands";
    _COMMONS.sendRequest (request, callbackReceive, urlPath, headers, "POST", command);
  } catch (err){
    _COMMONS.callbackError (err);
    _COMMONS.callbackRequestStateTx (false);
  }
};

//------------------------------------------------------------------------------------------------------------------------
//  public functions
//------------------------------------------------------------------------------------------------------------------------

return {
  init: init,
  getLastMessage: getLastMessage,
  sendCommand: sendCommand
};

})();

//========================================================================================================================

