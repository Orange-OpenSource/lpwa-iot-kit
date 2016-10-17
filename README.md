# lpwa-iot-kit
This project aims to develop resources for the users of Orange LoRa(R) Kit and to help developers of such resources organize their efforts (within Orange)

This code is part of the sample application provided with Orange IoT Starter KiT based on LoRa(R) technology (*) .
It is composed of an arduino code (to be loaded on the starter kit), and a Web App code.

(this part) The device sends periodically -every 3 minutes- a message containing the last luminosity sensor value, and can process a command coming from the Web app to light on/off a led.

The web application is used to pull datas sent by the starter kit and command a Led on the starter KiT.

We kept the two versions in front of the git in order to keep the backward compatibility with the previous board.

  code Arduino V1.0 is for Seeeduino Stalker v2.3
  code Arduino V1.3 is for SODAQ Mbili Rev.6b
  
(*) "LoRa, brand registered by Semtech Corporation"
