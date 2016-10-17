/**
* Copyright (C) 2015 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
//========================================================================================================================
//
//     LORA DEMONSTRATION APPLICATION
//
//========================================================================================================================

"use strict";

var _MAIN = (function (){

var
  _myDevice = {},
  _bargraph,
  _server;

//------------------------------------------------------------------------------------------------------------------------
//  modifies the page (request indicator, buttons) at the beginning and at the end of an ongoing request
//------------------------------------------------------------------------------------------------------------------------

function setRequestStateRx (ongoing){
  if(ongoing){
    document.getElementById ("rx-button").classList.add("invisible") ;
    document.getElementById ("rx-button-loader").classList.remove("invisible") ;
  } else {
    document.getElementById ("rx-button-loader").classList.add("invisible") ;
    document.getElementById ("rx-button").classList.remove("invisible") ;
  }
}

function setRequestStateTx (ongoing){
  if(ongoing){
    document.getElementById ("tx-button").classList.add("invisible") ;
    document.getElementById ("tx-button-loader").classList.remove("invisible") ;
  } else {
    document.getElementById ("tx-button-loader").classList.add("invisible") ;
    document.getElementById ("tx-button").classList.remove("invisible") ;
  }
}

//------------------------------------------------------------------------------------------------------------------------
//  displays an error message
//------------------------------------------------------------------------------------------------------------------------

function displayError (err){
  alert ("ERROR: " + err);
}

//------------------------------------------------------------------------------------------------------------------------
//  converts a date to a pleasant format
//
//  in:
//    date {date}
//  out:
//    returned value {string}
//------------------------------------------------------------------------------------------------------------------------

function formatDate (date){
  return (date.toLocaleDateString() + " " + date.toLocaleTimeString());
}

//------------------------------------------------------------------------------------------------------------------------
//  displays a received message content
//
//  in:
//    value {Uint8Array}: payload
//    at {date}: reception date
//    metadata {object}: metadata
//------------------------------------------------------------------------------------------------------------------------

function updateValues(value, ledState, lightValue){
  document.getElementById ("rx-value").innerHTML = "0x" + _COMMONS.convertByteArrayToHex (value);
    
  //----- led
  switch(ledState){
    case 0:
      document.getElementById ("rx-led").innerHTML = "OFF" ;
      document.getElementById ("rx-led-icon").classList.remove("led-on") ;
      document.getElementById ("rx-led-icon").classList.remove("led-blink") ;
      break;
    case 1:
      document.getElementById ("rx-led").innerHTML = "ON" ;
      document.getElementById ("rx-led-icon").classList.remove("led-blink") ;
      document.getElementById ("rx-led-icon").classList.add("led-on") ;
      break;
    case 2:
      document.getElementById ("rx-led").innerHTML = "Blink" ;
      document.getElementById ("rx-led-icon").classList.remove("led-on") ;
      document.getElementById ("rx-led-icon").classList.add("led-blink") ;  //ajout TANS 21012016
      break;
    default:
      throw ("wrong led value: " + ledState);
      break;
  }
  
  //----- light sensor
  document.getElementById ("rx-light").innerHTML = lightValue === undefined ? "Unknown" : lightValue ;
  _bargraph.refresh(lightValue) ;
}

function displayMessage (value, at, metadata){

  //----- at

  document.getElementById ("rx-date").innerHTML = formatDate (at);
    
  //----- metadata
  if(metadata.signalLevel !== undefined){
    for(var i = 0; i < 5; ++i)
      if(metadata.signalLevel > i)
        document.getElementById ("rx-signal-strength-bar" + (i + 1)).classList.add("bar-green");
      else
        document.getElementById ("rx-signal-strength-bar" + (i + 1)).classList.remove("bar-green");
  }
  
  //----- value
  //Old config: 0xAA0000BBCC  AA: LED, BBCC: Light sensor
  if (value.length == 5)
    updateValues(value, value[0], value[1] << 24 | value[2] << 16 | value[3] << 8 | value[4]);
  else if(value.length == 3)
    //New config: 0xAABBCC  AA: LED, BBCC: Light sensor
    updateValues(value, value[0], value[1] << 8 | value[2]);
  else
    //Default
    updateValues(value, 0, undefined);
  
  setRequestStateRx(false);
};

//------------------------------------------------------------------------------------------------------------------------
//  triggered when the user clicks on the "get last received message" button 
//------------------------------------------------------------------------------------------------------------------------

function onClickGetMessage (){

  document.getElementById ("rx-date").innerHTML = "";
  document.getElementById ("rx-value").innerHTML = "";
  document.getElementById ("rx-light").innerHTML = "";
  document.getElementById ("rx-led").classList.remove("led-on");
  document.getElementById ("rx-led").classList.remove("led-blink");
  
  setRequestStateRx(true);
  
  _server.getLastMessage (_myDevice, displayMessage);
}

//------------------------------------------------------------------------------------------------------------------------
//  triggered when the user clicks on the "send command" button 
//------------------------------------------------------------------------------------------------------------------------

function onClickSendCommand (){

  //----- callback

  function callbackSent (response){

    //Update UI
    if (response === undefined)
      throw ("command date is undefined");
    document.getElementById ("tx-date").innerHTML = formatDate (new Date (response));
    setRequestStateTx(false);
  };

  //----- main

    //clear UI
  document.getElementById ("tx-date").innerHTML = "";
  document.getElementById ("tx-value").innerHTML = "";
  document.getElementById ("tx-frame-counter").innerHTML = "";
  
    //create payload and send it
  var value = new Uint8Array (1);
  if (document.getElementById("tx-led-off").checked)
    value[0] = 0 ;
  else if (document.getElementById("tx-led-on").checked)
    value[0] = 1 ;
  else
    value[0] = 2 ;   // ajout BLK Value TANS le 22/01/2016
  
  //update UI
  document.getElementById ("tx-value").innerHTML = "0x" + _COMMONS.convertByteArrayToHex (value);
  setRequestStateTx(true);
  
  // send payload
  _server.sendCommand (_myDevice, value, _CONFIG_COMMONS.CmdFPort, true, callbackSent);
}

function init(){    
    
  if(window._CONFIG_LOM !== undefined)
    _CONFIG = _CONFIG_LOM;
  else
    throw "can't load a config";
  
  _myDevice.deviceID = _CONFIG.deviceID;
  document.getElementById ("deviceID").innerHTML = _CONFIG.deviceID ;
  
  _bargraph = Bargraph ("bargraph", _CONFIG_COMMONS.lightMin, _CONFIG_COMMONS.lightMax);
  
  _COMMONS.init(_CONFIG.url, _CONFIG_COMMONS.requestTimeout, displayError, setRequestStateRx, setRequestStateTx);

  if(window._CONFIG_LOM !== undefined && _CONFIG == window._CONFIG_LOM) {
    _server = _LOM;
    _server.init (_CONFIG.X_API_Key);
  }
}

//------------------------------------------------------------------------------------------------------------------------
//  triggered when the page is loaded
//------------------------------------------------------------------------------------------------------------------------

window.onload = function (e){
  try {      
    init();
  } catch (err) {
    displayError(err);
  }
}

//------------------------------------------------------------------------------------------------------------------------
//  public functions
//------------------------------------------------------------------------------------------------------------------------

return {
  init: init,
  onClickGetMessage: onClickGetMessage,
  onClickSendCommand: onClickSendCommand
};

})();

//========================================================================================================================
