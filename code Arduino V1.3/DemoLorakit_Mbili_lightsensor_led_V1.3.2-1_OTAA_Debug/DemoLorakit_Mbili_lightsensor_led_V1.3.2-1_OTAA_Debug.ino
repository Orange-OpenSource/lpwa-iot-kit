/**
* Copyright (C) 2016 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
/****************************************************************/
//  Software code for Groove - Ligth Sensor V1.3.2-1
//  on SODAQ Mbili Rev.6b
/****************************************************************/

/* 
The Debug monitor on USB
* Use "Serial" object or it's helper: "SerialDebug"
* 
The shield ATIM (Serial1):
* Use "Serial1" object or it's helper: "SerialXBee"
* 
The sensor:
* Groove Connector A4, A5, 3.3v, GND
* sensor 1.2 groove temp 1.2 use only Data -> analog 5 (A5), 3.3v -> 3.3v, GND -> gnd
*/ 
/***************************************************************/
/* created 12 december 2015 
*  by TAns Orange Labs (City)
*   modified 18 march 2016 TAns Orange Labs (City)
*  by MAM Orange Labs (City)
*   Last modified 14 september 2016 MAM Orange Labs (City)
*/

#include <math.h>

#define MODE_OTAA     // Uncomment/comment to enable/disable OTAA join mode

// **************** helpers for serial *************************
#define SerialDebug Serial  //ligne a commenter en cas d'utilisation sur batterie ou alimentation externe
#define SerialXBee Serial1

// **************** const delays *************************
const unsigned long ul_default_delay = 180000; // 130600 <=> 1% duty cycle, SF12, 5 bytes
const unsigned long ul_delay_loop = ul_default_delay;   // ERC7003 868 MHz 1% duty cycle   
const unsigned long xbee_serial_delay = 500;

// **************** const temp / light *************************
const int PIN_LIGHTSENSOR = A5;  // Grove - Temperature Sensor connect to A5
const int LIGHT_THRESHOLD_VALUE = 10;    //The threshold for which the LED should turn on. 
const int LED_PCB_PIN=9;         //Connect the PCB LED L0 to Pin13, Digital 13
const int LED_EXT_PIN=8;        //Connect the external Green LED to Pin 12, Digital 12

// **************** global vars *************************
byte by_CdeLed = 0; //Command received from the LoRa Module to switch the LED state (0x01: ON | 0x00: OFF | 0x02: Blink)

// **************** initialisation *****************************
void setup()
{ 
  SerialDebug.println("**************** DEMO STARTER KIT sensorlight + LED ***********************.\n ");  
  
  // *********** init Debug and Bee baud rate ***********************************
  SerialDebug.begin(19200);      // the debug baud rate on Hardware Serial Atmega
  SerialXBee.begin(19200);       // the Bee baud rate on Software Serial Atmega
  delay(1000);
  
  // *********** init digital pins **********************************************
  pinMode(LED_PCB_PIN, OUTPUT);     //Set the LED on Digital 12 as an OUTPUT
  digitalWrite(LED_PCB_PIN, LOW);  //init
  pinMode(LED_EXT_PIN, OUTPUT);     //Set the External Led on Digital 13 as an OUTPUT
  digitalWrite(LED_EXT_PIN, LOW);  //init
  
  SerialDebug.println("- Check LED Blinking on Board...\n");  
  
  led_blinking(10);  // blinking for ten seconds
  
  // set ATO & ATM Parameters for Nano N8  
  initXbeeNanoN8();
  
  SerialDebug.print("\n*************** Sensor Light Value & Led Activity on Board (period: "); 
  SerialDebug.print(ul_delay_loop * 1E-3); 
  SerialDebug.println(" sec) ************\n"); 
  
  delay(1000);
}  

void loop()
{
  /****************Up Link data ****************************************/
  
  //switch the Ext LED on
  digitalWrite(LED_EXT_PIN, HIGH);
  
  /****** light sensor measures **************************************/
  int sensorValue = analogRead(PIN_LIGHTSENSOR); //read light from sensor
  float Rsensor = RsensorCalc(sensorValue);
  
  /***************send light ***************/
  sendLightSensorValuetoNanoN8(sensorValue);
  //delay(1000);
    
  /***************print light ***************/
  printLightSensorValue(sensorValue, Rsensor);
  
  //switch the Ext LED on
  digitalWrite(LED_EXT_PIN, LOW);
  
  /********* Down Link get serial data  *****************************/
  unsigned long l_milli = millis(); //save current time for timeout
  while (!SerialXBee.available()) //wait for valid data
  if((millis() - l_milli) > 2100) break; //timeout at 2.1s (class A max air time is 2.1sec)
  
  if(SerialXBee.available()) {
    // read the down link serial Data:
    by_CdeLed = SerialXBee.read();
    
    SerialDebug.print("<-- Cde Led received = ");
    SerialDebug.println(by_CdeLed);
    
    while(SerialXBee.read() > -1); //empty XBee buffer
    
    switch (by_CdeLed) {
      case 0: 
      digitalWrite(LED_PCB_PIN, LOW);
      break;
      case 1:
      digitalWrite(LED_PCB_PIN, HIGH);
      break;  
      case 2: 
      led_blinking(30);  // both leds blink for 30 sec
      break;
    }
  }
  
  delay(ul_delay_loop); //get and send datas every 180 sec (default).
  
}   // end loop

/*************************** methods **********************************/

void initXbeeNanoN8()
{
  String str_dummy;
  
  // ************ Command Mode *****************
  // set ATO & ATM Parameters (Unconf frame, port com, encoding, rx payload only, Duty Cycle...)
  SerialXBee.print("+++");          // Enter command mode
  str_dummy = SerialXBee.readString();
  SerialDebug.println("\n- Enter command mode: +++");     
  delay(xbee_serial_delay);
  
  SerialXBee.print("ATV\n");    // Return module version, DevEUI (LSB first), Stack version.
  str_dummy = SerialXBee.readString();
  SerialDebug.print("\n ATIM Module version & information:");     
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
  /***************** Serial Rx ****************************************/
  SerialXBee.print("ATM007=06\n");    // Baud rate 19200
  str_dummy = SerialXBee.readString();
  SerialDebug.print(" --> Xbee Serial rate 19200 ATM007=06: ");    
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
  /***************** DevEUI ****************************************/
  SerialXBee.print("ATO070\n");    // DevEUI (4 Bytes all at once)
  str_dummy = SerialXBee.readString();
  SerialDebug.print(" get DevEUI (LSB F) ATO070: ");    
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
  // /***************** JoinMode ****************************************/
  SerialXBee.print("ATO083\n"); //get actual join mode
  str_dummy = SerialXBee.readString();
  delay(xbee_serial_delay);
  
#ifdef MODE_OTAA
  
  SerialDebug.print(" --> OTAA ");
  SerialDebug.println(str_dummy);
  
  /***************** OTAA ****************************************/
  if(str_dummy[7] != '3' || str_dummy[8] != 'F') { //avoid to restart if already in the right mode
    SerialXBee.print("ATO083=3F\n");    // OTAA
    str_dummy = SerialXBee.readString();  
    SerialDebug.println(" set to OTAA mode: "); 
    SerialDebug.println(str_dummy);
    delay(xbee_serial_delay);
    
    SerialDebug.println(" Save new configuration");
    SerialXBee.print("ATOS");    // save param to EEPROM
    while(SerialXBee.read() > -1); //empty buffer
    delay(xbee_serial_delay);
    
    SerialDebug.println(" Restart the module"); 
    SerialXBee.print("ATR\n");    // restart the module
    delay(1500);
  }
  
  /***************** AppEUI ****************************************/
  SerialXBee.print("ATO071\n");    // AppEUI (4 Bytes all at once)
  str_dummy = SerialXBee.readString();
  SerialDebug.print(" get AppEUI (LSB F) ATO071: ");    
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
  /***************** AppKey ****************************************/
  SerialXBee.print("ATO072\n");    // AppKey (16 Bytes all at once)
  str_dummy = SerialXBee.readString();
  SerialDebug.print(" get AppKey (LSB F) ATO072: ");    
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
#else
  
  SerialDebug.print(" --> ABP ");
  SerialDebug.println(str_dummy);
  
  /***************** ABP ****************************************/
  if(str_dummy[7] != '3' || str_dummy[8] != 'E'){ //avoid to restart if already in the right mode    
    SerialXBee.print("ATO083=3E\n");    // ABP
    str_dummy = SerialXBee.readString();
    SerialDebug.println(" set to OTAA mode: "); 
    SerialDebug.println(str_dummy);
    delay(xbee_serial_delay);
    
    SerialDebug.println(" Save new configuration"); 
    SerialXBee.print("ATOS");    // save param to EEPROM
    while(SerialXBee.read() > -1); //empty buffer
    delay(xbee_serial_delay);
    
    SerialDebug.println(" Restart the module"); 
    SerialXBee.print("ATR\n");    // restart the module
    delay(1500);
  }
  
  /***************** DevAddr ****************************************/
  SerialXBee.print("ATO069\n");    // AppSKey (16 Bytes all at once)
  str_dummy = SerialXBee.readString();
  SerialDebug.print(" get DevAddr (LSB F) ATO069: ");    
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
  /***************** AppSKey ****************************************/
  SerialXBee.print("ATO074\n");    // AppSKey (16 Bytes all at once)
  str_dummy = SerialXBee.readString();
  SerialDebug.print(" get AppSKey (LSB F) ATO074: ");    
  SerialDebug.println(str_dummy);
  delay(xbee_serial_delay);
  
#endif
  
  /***********************Quit COMMAND MODE ********************/  
  SerialXBee.print("ATQ\n");        // Quit command mode
  str_dummy = SerialXBee.readString();
  SerialDebug.println("\n- Quit command mode: ATQ");
  delay(xbee_serial_delay);
} 

void led_blinking(int sec)
{
  SerialDebug.print(" --> led blinking... ");
  SerialDebug.print(sec);
  SerialDebug.print("sec ");
  
  int i_cmp = 0;
  while (i_cmp++ < sec)
  {
    // blink
    digitalWrite(LED_PCB_PIN, HIGH);
    delay(450); // wait for a second
    
    digitalWrite(LED_PCB_PIN, LOW);
    delay(450); // wait for a second
  }
  
  SerialDebug.println("...end blinking");
}

void sendLightSensorValuetoNanoN8(int l_value)
{ 
  if (ul_delay_loop >= ul_default_delay)    // ERC7003 868 MHz 1% duty cycle frame  
  {
    
      //read the led state
      byte pcbState = by_CdeLed;
      if(by_CdeLed < 2) { //check real state ON or OFF (can't check blinking)
        pinMode(LED_PCB_PIN, INPUT);
        pcbState = digitalRead(LED_PCB_PIN);
        pinMode(LED_PCB_PIN, OUTPUT);
        digitalWrite(LED_PCB_PIN, pcbState); //restore previous state
      } else {
        by_CdeLed = 0; //reset Blink to OFF
      }
    
    //read the 2 bytes of light sensor
    byte b_lsb = l_value & 0xFF;
    byte b_msb = (l_value >> 8) & 0xFF;
    
    //send the frame
    SerialXBee.write(pcbState); //LED state
    //send new light value transmit to NANO-N8 in MSB first
    SerialXBee.write(b_msb);
    SerialXBee.write(b_lsb);
    
    //print the sent frame (in hex) in serial debug
    SerialDebug.print("--> Send frame: 0x0");
    //print the first byte
    SerialDebug.print(pcbState, HEX); //LED state
    
    //print the second byte
    if(b_msb < 0x10) //send in reverse endian
      SerialDebug.print(0); //force to print 2 digits in hex
    SerialDebug.print(b_msb, HEX);
    
    //print the first byte
    if(b_lsb < 0x10) //send in reverse endian
      SerialDebug.print(0); //force to print 2 digits in hex
    SerialDebug.print(b_lsb, HEX);
    
    SerialDebug.print(" ");
  }
}

float RsensorCalc(int i_value)
{
  return (1023 - i_value) * 10.0f / i_value;
}

void printLightSensorValue(int i_value, float f_value)
{
  SerialDebug.print("Light (sensorvalue) = ");
  SerialDebug.print(i_value);
  SerialDebug.print("  |  ");
  SerialDebug.print("Rsensor = ");
  SerialDebug.println(f_value);//show the light intensity on the serial monitor;
  //delay(1000);
} 
