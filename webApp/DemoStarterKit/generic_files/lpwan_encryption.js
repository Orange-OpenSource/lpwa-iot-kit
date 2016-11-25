/**
* Copyright (C) 2015 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
//========================================================================================================================
//
//     LPWAN PAYLOAD ENCRYPTION AND DECRYPTION
//
//========================================================================================================================

"use strict";

var _LPWAN_ENCRYPTION = (function (){

//------------------------------------------------------------------------------------------------------------------------
//  creates a data context for subsequent encryptions or decryptions
//
//  in:
//    appSKey {Uint8Array}: AES encryption/decryption session key
//    devAddr {Uint8Array}: end-device address
//  out:
//    returned value {object}: context
//------------------------------------------------------------------------------------------------------------------------

function createContext (appSKey, devAddr){
 
  var blockA = new Uint8Array (16);
  blockA[0] = 1 ;
  blockA[1] = 0 ;
  blockA[2] = 0 ;
  blockA[3] = 0 ;
  blockA[4] = 0 ;
  blockA[6] = devAddr[0];
  blockA[7] = devAddr[1];
  blockA[8] = devAddr[2];
  blockA[9] = devAddr[3];
  blockA[14] = 0 ;

  var aesEncryptionContext = _AES_ENCRYPTION.createContext (appSKey);
  
  return  {
    blockA: blockA,
    aesEncryptionContext: aesEncryptionContext
  }
}

//------------------------------------------------------------------------------------------------------------------------
//  encrypts or decrypts a payload
//
//  in:
//    context {object}: encryption context
//    uplink {boolean}: true for uplink
//    frameCounter {positive integer}: frame counter
//    payloadIn {Uint8Array}: payload to encrypt/decrypt 
//  out:
//    payloadOut {Uint8Array, same size as payloadIn, can share the same buffer with payloadIn}: encrypted payload
//------------------------------------------------------------------------------------------------------------------------

function encryptOrDecrypt (context, uplink, frameCounter, payloadIn, payloadOut){

  var blockA = context.blockA ;
  blockA[5] = uplink ? 0 : 1 ;
  blockA[10] = 0xFF & frameCounter ;
  blockA[11] = 0xFF & (frameCounter >> 8);
  blockA[12] = 0xFF & (frameCounter >> 16);
  blockA[13] = 0xFF & (frameCounter >> 24);

  var blockS = new Uint8Array (16);
  var len = payloadIn.length ;
  var buf = new Uint8Array (len);
  var blockNumber = Math.ceil (len / 16);
  var lastBlockSize = len % 16 ;
  var byteIndex = 0 ;
  for (var blockIndex = 1 ; blockIndex <= blockNumber ; blockIndex++){
    blockA[15] = blockIndex ;
    _AES_ENCRYPTION.encrypt (context.aesEncryptionContext, blockA, blockS);
    var blockSize = (blockIndex === blockNumber)? lastBlockSize : 16 ;
    for (var byteCount = 0 ; byteCount < blockSize ; byteCount++, byteIndex++)
      payloadOut[byteIndex] = payloadIn[byteIndex] ^ blockS[byteCount];
  }
}

//------------------------------------------------------------------------------------------------------------------------
//  public functions
//------------------------------------------------------------------------------------------------------------------------

return {
  createContext: createContext,
  encryptOrDecrypt: encryptOrDecrypt
}

})();

//========================================================================================================================
