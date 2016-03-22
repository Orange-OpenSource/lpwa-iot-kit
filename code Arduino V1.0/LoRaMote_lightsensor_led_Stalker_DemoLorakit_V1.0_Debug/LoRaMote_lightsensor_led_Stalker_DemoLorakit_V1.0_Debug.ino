/**
* Copyright (C) 2015 Orange
*
* This software is distributed under the terms and conditions of the 'Apache-2.0'
* license which can be found in the file 'LICENSE' in this package distribution
* or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/
/****************************************************************/
//  Software code for Grove - Ligth Sensor V1.1
//  on Seeeduino Stalker v2.3
/****************************************************************/

/* 
 The Debug monitor (default hardware serial:
 * RX is digital pin 30 (connect to TXD of Sparkfun J2.TXD)
 * TX is digital pin 31 (connect to RXD of Sparkfun J2.RXD)
 * 
 The shield ATIM (software serial):
 * RX is PD6 digital pin 10 (connect to TX of xbee device pin 2)
 * TX is PD7 digital pin 11 (connect to RX of xbee device pin 3)
 * 
 The sensor:
 * Groove Connector I2C SCL, SDA, 5v, GND
 * pins SCL & SDA connect to analog 5 and 6 
 * sensor 1.2 groove temp 1.2 use only Data -> SCL, 5v -> 5 v, GND -> gnd
*/ 
/***************************************************************/
/* created 12 december 2015 
 *  by TAns Orange Labs (City)
 *   last modified 18 march 2016 TAns Orange Labs (City)
 */
 
#include <math.h>
#include <SoftwareSerial.h>

// set up a new serial object
const byte RXPIN = 6;   // aT.328.Rx pin 10   PD6   
const byte TXPIN = 7;   //  at 328.Tx pin 11   PD7 
SoftwareSerial mySerial(RXPIN, TXPIN);

String str_dummy, str_firmwareVer;

int i_cmp = 0;
byte by_CdeLed = 0; 
byte by_extLedState = 0;
byte by_pcbLedState = 0;
unsigned long ul_delay_loop = 180000;   // ERC7003 868 MHz 1% duty cycle   
unsigned long ul_default_delay = 180000;
unsigned long ul_RealNumber;    // conversion float to bin

long l_milli = 0;   
float f_Rsensor;    //Resistance of sensor in K

const byte by_ON = 1;
const byte by_OFF = 0;
const byte by_IDL = 2;  

// **************** const temp / light *************************
const int PIN_LIGHTSENSOR = A5;  // Grove - Temperature Sensor connect to A5
const int PCB_LEDPIN=13;         //Connect the PCB LED L0 to Pin13, Digital 13
const int EXT_LEDPIN=12;        //Connect the external Green LED to Pin 12, Digital 12
const int THRESHOLDVALUE=10;    //The threshold for which the LED should turn on. 

// **************** initialisation *****************************
void setup()
{ 
  Serial.println("**************** DEMO STARTER KIT sensorlight + LED ***********************.\n ");  
  
  // *********** init Debug and Bee baud rate ***********************************
  initXbeeDebugSerials(19200, 19200);  // debug baud rate & xbee baud rate = 19200 on Atmega side
    
  // *********** init digital pins **********************************************
  pinMode(PCB_LEDPIN,OUTPUT);      //Set the LED on Digital 12 as an OUTPUT
  pinMode(EXT_LEDPIN,OUTPUT);     //Set the External Led on Digital 13 as an OUTPUT
  
  Serial.println("- Check LEDs Blinking on Stalker...\n");     
  led_blinking(PCB_LEDPIN, EXT_LEDPIN, 10);  // blinking for ten seconds
  i_cmp = 0; 

  led_On_Off(PCB_LEDPIN, by_ON, EXT_LEDPIN, by_ON); // Leds ON along with command mode
  
  // set ATO & ATM Parameters for Nano N8  
  initXbeeNanoN8();
 
  led_On_Off(PCB_LEDPIN, by_OFF, EXT_LEDPIN, by_OFF); // Leds Off after command mode

  Serial.print("\n");     
  Serial.print("*************** Module version (DevEUI): ********************************* ");     
  Serial.println(str_firmwareVer);     // Send firmwareVer
  Serial.print("\n");     
  Serial.println("*************** Sensor Light Value & Led Activity on Stalker: ************\n"); 
  delay(3000);

}  
    
void loop()
{
  /****************Up Link data ****************************************/
 
   /****** light sensor measures **************************************/
    int sensorValue = analogRead(PIN_LIGHTSENSOR); //read light from sensor
    float Rsensor = RsensorCalc(sensorValue);
    
   /***************send light ***************/
    sendLightSensorValuetoNanoN8(sensorValue);
    delay(1000);
   /***************send light ***************/
    printLightSensorValue(sensorValue, Rsensor);  
       
   /********* Down Link get serial data  *****************************/
    l_milli = millis();
    while (mySerial.available () == 0) {
     if((millis()-l_milli) > 2100) break;
    }
    while (mySerial.available () > 0) {
      // read the down link serial Data:
      by_CdeLed = mySerial.read();
      Serial.println("");
      Serial.print("--> Cde Led received = ");
      Serial.print(by_CdeLed);
      switch (by_CdeLed) {
         case 0: led_On_Off(PCB_LEDPIN, by_OFF, EXT_LEDPIN, by_IDL);
                 break;
         case 1: led_On_Off(PCB_LEDPIN, by_ON, EXT_LEDPIN, by_IDL);
                 break;  
         case 2: led_blinking(PCB_LEDPIN, EXT_LEDPIN, 30);  // both leds blink for 30 sec
                 break;
      }
    }
    delay(ul_delay_loop); //get and send datas every 180 sec (default).
  
 }   // end loop

/*************************** methods **********************************/

 void initXbeeDebugSerials(int xbee_rate, int debug_rate)
 {
  Serial.begin(debug_rate);        // the debug baud rate on Hardware Serial Atmega 
  mySerial.begin(xbee_rate);       // the Bee baud rate on Software Serial Atmega
  delay(1000);
 } 

 void initXbeeNanoN8()
 {
  // ************ Command Mode *****************
  // set ATO & ATM Parameters (Unconf frame, port com, encoding, rx payload only, Duty Cycle...)
  Serial.println("");Serial.println("- Enter command mode: +++");     
  mySerial.print("+++");          // Enter command mode
  str_dummy = mySerial.readString();
  delay(1500);
        
  //Serial.println("Read module version (DevEUI) : ");          
  mySerial.print("ATV\n");    // Return module version, DevEUI (LSB first), Stack version.
  str_firmwareVer = mySerial.readString();
  delay(1500);
  
  
  /***************** Rx ****************************************/
  Serial.println(" --> Xbee Serial rate 19200 ATM007=06: ");    
  mySerial.print("ATM007=06\n");    // Baud rate 19200
  str_dummy = mySerial.readString();
  delay(1500);
 
  /***********************Quit COMMAND MODE ********************/  
  Serial.println("");Serial.println("- Quit command mode: ATQ");
  mySerial.print("ATQ\n");        // Quit command mode
  str_dummy = mySerial.readString();
  delay(1500);
  
 } 
 
void led_On_Off(int led1, byte by_cmdLed1, int led2, byte by_cmdLed2)
 {
  if (by_cmdLed1 == by_OFF) { 
    digitalWrite(led1, LOW);   // pcb LED OFF
    by_pcbLedState = 0;
    Serial.println(" --> Led pcb OFF");
  }
  if (by_cmdLed1 == by_ON) { 
    digitalWrite(led1, HIGH);   // pcb LED ON
    by_pcbLedState = 1;
    Serial.println(" --> Led pcb ON");
  }
  if (by_cmdLed2 == by_OFF) { 
    digitalWrite(led2, LOW);   // external LED OFF
    by_extLedState = 0; 
  }
  if (by_cmdLed2 == by_ON) { 
    digitalWrite(led2, HIGH);   // external LED ON
    by_extLedState = 1;
  }
 }
       
void led_blinking(int led1, int led2, int sec)
 {
 Serial.print(" --> led blinking...");
 while (i_cmp < sec) 
   {
   // blink on received cde
   digitalWrite(led1, HIGH);   // turn the pcb LED ON
   digitalWrite(led2, HIGH);   // external LED ON
   by_pcbLedState = 1;
   by_extLedState = 1;
      delay(500);   
   digitalWrite(led1, LOW);    // turn the pcb LED OFF 
   digitalWrite(led2, LOW);   // external LED OFF
   by_pcbLedState = 0;
   by_extLedState = 0;
      delay(300);              // wait for a second
   i_cmp++;
   }
   i_cmp = 0;
   //by_CdeLed = 0;
   Serial.println("... end blinking");
 }

 void sendLightSensorValuetoNanoN8(long l_value)
  { 
    unsigned char *uc_adr; 
    ul_RealNumber = l_value;
    
    uc_adr[0] = (ul_RealNumber >> 24) & 0xFF;
    uc_adr[1] = (ul_RealNumber >> 16) & 0xFF;
    uc_adr[2] = (ul_RealNumber >> 8) & 0xFF;
    uc_adr[3] = ul_RealNumber & 0xFF;
    
    if (ul_delay_loop == ul_default_delay)    // ERC7003 868 MHz 1% duty cycle frame  
    {
        Serial.print("--> Send four bytes:  ");
        mySerial.write(by_pcbLedState);
        for (byte i = 0; i < 4; i++) //  new light value transmit to NANO-N8
        
             mySerial.write(uc_adr[i]);
    }
  }

 float RsensorCalc(int i_value)
  {
    float f_resistor=(float)(1023-i_value)*10/i_value;
    if(f_resistor>THRESHOLDVALUE)
    {
      digitalWrite(EXT_LEDPIN,HIGH);
      by_extLedState = 1;
    }
    else
    {
      digitalWrite(EXT_LEDPIN,LOW);
      by_extLedState = 0;
    }
    return f_resistor;
  }
 void printLightSensorValue(int i_value, float f_value)
  {
    Serial.print(" Light (sensorvalue) = ");
    Serial.print(i_value);
    Serial.print("  |  ");
    Serial.print("Rsensor = ");
    Serial.println(f_value);//show the light intensity on the serial monitor;
    delay(1000);
  } 
