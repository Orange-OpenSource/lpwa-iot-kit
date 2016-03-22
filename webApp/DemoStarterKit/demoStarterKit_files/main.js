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
  _myDevice = { datasource: _CONFIG.datasource },
  _bargraph ;

//------------------------------------------------------------------------------------------------------------------------
//  modifies the page (request indicator, buttons) at the beginning and at the end of an ongoing request
//------------------------------------------------------------------------------------------------------------------------

function setRequestState (ongoing){

  document.getElementById ("rx-button").disabled = ongoing ;
  document.getElementById ("tx-button").disabled = ongoing ;
  document.getElementById ("request-indicator").className = ongoing ? "indicator indicator-on" : "indicator";
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

function displayMessage (value, at, metadata){

  //----- at

  document.getElementById ("rx-date").innerHTML = formatDate (at);
    
  //----- metadata

  document.getElementById ("rx-rssi").innerHTML = metadata.rssi + " dBm";
  document.getElementById ("rx-snr").innerHTML = metadata.snr + " dB";

  //----- value

  //if (value.length !== 5) // TA 18012016
    //throw ("wrong 'value' field length (5 bytes expected)");
  document.getElementById ("rx-value").innerHTML = "0x" + _DATAVENUE.convertByteArrayToHex (value);
    
  //----- led

  var led = value[0];
  if (led === 1)
    document.getElementById ("rx-led").innerHTML = "On" ;
  else if (led === 0)
    document.getElementById ("rx-led").innerHTML = "Off" ;
  else if (led === 2)
    document.getElementById ("rx-led").innerHTML = "Blink" ;  //ajout TANS 21012016
  else
    throw ("wrong led value");


  //----- light sensor = value =  0x0100000109 ==> 01 x 256 + 09 x 1 = light sensor = 265  

  var light = ((value[1]*256 + value[2])*256 + value[3])*256 + value[4];  
  document.getElementById ("rx-light").innerHTML = light ;  
  _bargraph.refresh (light);
  _bargraph.show ();
};

//------------------------------------------------------------------------------------------------------------------------
//  triggered when the user clicks on the "get last received message" button 
//------------------------------------------------------------------------------------------------------------------------

function onClickGetMessage (){

  document.getElementById ("rx-date").innerHTML = "";
  document.getElementById ("rx-value").innerHTML = "";
  document.getElementById ("rx-snr").innerHTML = "";
  document.getElementById ("rx-rssi").innerHTML = "";
  document.getElementById ("rx-light").innerHTML = "";
  document.getElementById ("rx-led").innerHTML = "";
  _bargraph.hide ();

  _DATAVENUE.getLastMessage (_myDevice, displayMessage);
}

//------------------------------------------------------------------------------------------------------------------------
//  triggered when the user clicks on the "send command" button 
//------------------------------------------------------------------------------------------------------------------------

function onClickSendCommand (){

  //----- callback 2

  function callback2 (response){

    if (response.at === undefined)
      throw ("'at' field missing");
    document.getElementById ("tx-date").innerHTML = formatDate (new Date (response.at));
  };

  //----- callback 1

  function callback1 (frameCounter){

    frameCounter++ ;
    document.getElementById ("tx-frame-counter").innerHTML = frameCounter ;
    var value = new Uint8Array (1);
    //value[0] = (document.getElementById("tx-led-off").checked)? 0 : 1 ;
	if (document.getElementById("tx-led-off").checked)
	  value[0] = 0 ;
	else if (document.getElementById("tx-led-on").checked)
	  value[0] = 1 ;
	else
	  value[0] = 2 ;   // ajout BLK Value TANS le 22/01/2016
    document.getElementById ("tx-value").innerHTML = "0x" + _DATAVENUE.convertByteArrayToHex (value);
    var metadata = {
      fcnt: frameCounter,
      port: _CONFIG.CmdFPort,
      confirmed: "true"
    };
    _DATAVENUE.sendCommand (_myDevice, value, metadata, callback2);
  };

  //----- main

  document.getElementById ("tx-date").innerHTML = "";
  document.getElementById ("tx-value").innerHTML = "";
  document.getElementById ("tx-frame-counter").innerHTML = "";
  _DATAVENUE.getDownlinkFrameCounter (_myDevice, callback1);
}

//------------------------------------------------------------------------------------------------------------------------
//  triggered when the page is loaded
//------------------------------------------------------------------------------------------------------------------------

window.onload = function (e){

  document.getElementById ("datasource").innerHTML = _CONFIG.datasource ;  
  _bargraph = Bargraph ("bargraph", _CONFIG.lightMin, _CONFIG.lightMax);
  _DATAVENUE.init (_CONFIG.datavenueUrl, _CONFIG.requestTimeout, _CONFIG.X_OAPI_Key, _CONFIG.X_ISS_Key,
  displayError, setRequestState);
  _DATAVENUE.initDevice (_myDevice, _CONFIG.appSKey);
}

//------------------------------------------------------------------------------------------------------------------------
//  public functions
//------------------------------------------------------------------------------------------------------------------------

return {
  onClickGetMessage: onClickGetMessage,
  onClickSendCommand: onClickSendCommand
};

})();

//========================================================================================================================
