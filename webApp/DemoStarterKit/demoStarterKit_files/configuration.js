/**   
* Copyright (C) 2015 Orange   
*   
* This software is distributed under the terms and conditions of the 'Apache-2.0'   
* license which can be found in the file 'LICENSE' in this package distribution   
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.   
*/   
   
//========================================================================================================================   
//   
//     CONFIGURATION CONSTANTS   
//   
//========================================================================================================================   
   
var _CONFIG = {   
  //----- datasource identifier for the concerned device   
  datasource : "1cc07401e00140fd91498a2355bb35db",
   
  //----- AES encryption/decryption cipher application session key (use "" for no encryption)   
  appSKey : "2e9017786eef1234567897c456242",
   
  //----- datavenue server url   
  datavenueUrl: "https://api.orange.com/datavenue/v1",   
   
  //----- security keys   
  X_OAPI_Key : "mr58123456789d3koGvOOBWntDZIak12",
  X_ISS_Key : "dcc5dff123456755555855dcd5be3ac4e",
   
  //----- maximum time for a request (in milliseconds, use 0 for no timeout)   
  requestTimeout: 8000,   
   
  //----- Command Fport   
  CmdFPort: 5,   
   
  //----- light sensor measurement range   
  lightMin:   10,   //  darkness one hundred per cent   
  lightMax: 1100      
   
};   
//========================================================================================================================   
   
   
   
   
   
   
   
   
   
   
   
   
   
