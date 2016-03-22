/**
* Copyright (C) 2015 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
//========================================================================================================================
//
//     SIMPLE BICOLOR BARGRAPH
//
//========================================================================================================================

"use strict";

//------------------------------------------------------------------------------------------------------------------------
//  constructor
//
//  in:
//    _divId {string}: html div element id
//    _valMin {number}: minimum value
//    _valMax {number}: maximum value
//------------------------------------------------------------------------------------------------------------------------

function Bargraph (_divId, _valMin, _valMax){

var _divContainer, _divLeft, _width, _valDelta ;

//------------------------------------------------------------------------------------------------------------------------
//  refresh value
//
//  in:
//    val {number}: value
//------------------------------------------------------------------------------------------------------------------------

function refresh (val){

  if (val < _valMin)
    val = _valMin ;
  else if (val > _valMax)
    val = _valMax ;
  var width = Math.round ((_width*(val - _valMin))/_valDelta);
  if (width === 0){
	_divLeft.setAttribute ("class", "bargraph-right");
    _divLeft.setAttribute ("style", "width:1px");
  } else {
    _divLeft.setAttribute ("style", "width: " + width + "px");
    _divLeft.setAttribute ("class", "bargraph-left");
  }
}

//------------------------------------------------------------------------------------------------------------------------
//  show/hide
//------------------------------------------------------------------------------------------------------------------------

function show (){

  _divContainer.className = "bargraph";
}

function hide (){

  _divContainer.className = "invisible";
}

//------------------------------------------------------------------------------------------------------------------------
//  main
//------------------------------------------------------------------------------------------------------------------------

_divContainer = document.getElementById (_divId);
_divContainer.innerHTML = "<div class='bargraph-right'></div><div class='bargraph-right'></div>";
_divContainer.className = "bargraph";
_width = _divContainer.getBoundingClientRect().width ;
_divContainer.className = "invisible";
_divLeft = _divContainer.childNodes[0];
_valDelta = _valMax - _valMin ;

//------------------------------------------------------------------------------------------------------------------------
//  public functions
//------------------------------------------------------------------------------------------------------------------------

return {
  refresh: refresh,
  show: show,
  hide: hide
};
}

//========================================================================================================================
