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

/***************************************************************/
/* created 12 december 2015 
 *  by TAns Orange Labs (City)
 *   last modified 18 Mars 2016 by Othmane Amane (Technocentre Orange)
 */
 
#include <math.h>

byte ArrayOfFourBytes[4];

int i_cmp = 0;
byte by_CdeLed = 0; 
byte by_extLedState = 0;
byte by_pcbLedState = 0;
long i_delay_loop = 180000;

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
    // *********** init Debug and Bee baud rate ***********************************
  initXbeeDebugSerials(19200);  // xbee baud rate = 19200 on Atmega side
    
  // *********** init digital pins **********************************************
  pinMode(PCB_LEDPIN,OUTPUT);      //Set the LED on Digital 12 as an OUTPUT
  pinMode(EXT_LEDPIN,OUTPUT);     //Set the External Led on Digital 13 as an OUTPUT
     
  led_blinking(PCB_LEDPIN, EXT_LEDPIN, 10);  // blinking for ten seconds
  led_On_Off(PCB_LEDPIN, by_ON, EXT_LEDPIN, by_ON); // Leds ON along with command mode
  
  // set ATO & ATM Parameters for Nano N8  
  initXbeeNanoN8();
 
  led_On_Off(PCB_LEDPIN, by_OFF, EXT_LEDPIN, by_OFF); // Leds Off after command mode
  delay(3000); 
}  
    
void loop()
{
   /****** light sensor measures **************************************/
    int sensorValue = analogRead(PIN_LIGHTSENSOR); //read light from sensor
    float Rsensor = RsensorCalc(sensorValue);
    
   /***************send light or temperature***************/
   sendLightSensorValuetoNanoN8(sensorValue);
   delay(1000);
      
   /********* Down Link get serial data  *****************************/
    l_milli = millis();
    while (Serial.available () == 0) {
     if((millis()-l_milli) > 2100) break;
    }
    while (Serial.available () > 0) {
      // read the down link serial Data:
      by_CdeLed = Serial.read();
      
      switch (by_CdeLed) {
         case 0: led_On_Off(PCB_LEDPIN, by_OFF, EXT_LEDPIN, by_IDL);
                 break;
         case 1: led_On_Off(PCB_LEDPIN, by_ON, EXT_LEDPIN, by_IDL);
                 break;  
         case 2: led_blinking(PCB_LEDPIN, EXT_LEDPIN, 30);  // both leds blink for 30 sec
                 break;
      }
    }
    delay(i_delay_loop); //get and send datas every 3 minutes (default).
  
 }  

/*************************** methods **********************************/

 void initXbeeDebugSerials(int xbee_rate)
 {
  Serial.begin(xbee_rate);       // the Bee baud rate on Software Serial Atmega
  delay(1000);
 } 

 void initXbeeNanoN8()
 {
  // ************ Command Mode *****************
  // set ATO & ATM Parameters (Unconf frame, port com, encoding, rx payload only, Duty Cycle...)    
  Serial.print("+++");          // Enter command mode
  delay(1500);
        
  //Serial.println("Read module version (DevEUI) : ");          
  Serial.print("ATV\n");    // Return module version, DevEUI (LSB first), Stack version.
  delay(1500);
  
  /***************** Rx ****************************************/
  Serial.print("ATM007=06\n");    // Baud rate 19200
  delay(1500);
 
  /***********************Quit COMMAND MODE ********************/  
  Serial.print("ATQ\n");        // Quit command mode
  delay(1500);
  
 } 
 
void led_On_Off(int led1, byte by_cmdLed1, int led2, byte by_cmdLed2)
 {
  if (by_cmdLed1 == by_OFF) { 
    digitalWrite(led1, LOW);   // pcb LED OFF
    by_pcbLedState = 0;
  }
  if (by_cmdLed1 == by_ON) { 
    digitalWrite(led1, HIGH);   // pcb LED ON
    by_pcbLedState = 1;
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
 }

 void sendLightSensorValuetoNanoN8(int i_value)
  { 
    int byteOne = (int) i_value / 256;
    int byteTwo = (int) i_value % 256;
    
        (by_pcbLedState==0)?Serial.write((byte)0x00):Serial.write(0x01);
        Serial.write((byte)0x00);
        Serial.write((byte)0x00);
        (byteOne==0)?Serial.write((byte)0x00):Serial.write((byte)byteOne);
        (byteTwo==0)?Serial.write((byte)0x00):Serial.write((byte)byteTwo);

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
 
