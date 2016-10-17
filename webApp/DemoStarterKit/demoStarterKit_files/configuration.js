/**   
* Copyright (C) 2015 Orange   
*   
* This software is distributed under the terms and conditions of the 'Apache-2.0'   
* license which can be found in the file 'LICENSE' in this package distribution   
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.   
*/   

var _CONFIG;

//*
//========================================================================================================================   
//   
//     LOM CONFIGURATION CONSTANTS   
//   
//========================================================================================================================   

var _CONFIG_LOM = {   
  
  //----- LOM server url   
  url : "https://lpwa.liveobjects.orange-business.com/api/v0", //LOM Prod
  
  //----- device identifier 
  deviceID : "",
  
  //----- security key
  X_API_Key : ""
};

_CONFIG = _CONFIG_LOM; //select LOM by default
//*/

//========================================================================================================================   
//   
//     COMMONS CONFIGURATION CONSTANTS   
//   
//========================================================================================================================   

var _CONFIG_COMMONS = {
   
  //----- maximum time for a request (in milliseconds, use 0 for no timeout)   
  requestTimeout: 8000,   
   
  //----- Command Fport   
  CmdFPort: 5,   
   
  //----- light sensor measurement range   
  lightMin:   10,   //  darkness one hundred per cent   
  lightMax: 1023      
   
};

//========================================================================================================================   
   
   
   
   
   
   
   
   
   
   
   
   
   
