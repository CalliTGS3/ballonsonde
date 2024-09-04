function Senden () {
    radio.sendString("LZ:" + Laufzeit)
    radio.sendString("UZ:" + Uhrzeit)
    radio.sendString("LA:" + Laenge)
    radio.sendString("BR:" + Breite)
    radio.sendString("HO:" + Hoehe)
    radio.sendString("TE:" + Temperatur)
    radio.sendString("LU:" + Luftdruck)
    radio.sendString("LF:" + Luftfeuchte)
    radio.sendString("LI:" + Lichtstaerke)
    radio.sendString("UV:" + Ultraviolett)
    radio.sendString("IR:" + Infrarot)
}
function Messen () {
    Laufzeit = input.runningTime() / 1000
    Uhrzeit = NEO6M_GPS.getGPSTime()
    Breite = NEO6M_GPS.getGPSLatitude()
    Laenge = NEO6M_GPS.getGPSLongitude()
    Hoehe = NEO6M_GPS.getAltitude()
    Temperatur = bme280.temperature()
    Luftdruck = bme280.pressure()
    Luftfeuchte = bme280.humidity()
    Lichtstaerke = SI1145.readLight(ILLUMINANCE.LUX)
    Ultraviolett = SI1145.readUVI()
    Infrarot = SI1145.readIR()
}
input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    Arbeiten = true
})
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    Arbeiten = false
})
function initFlightMode () {
    let buf: Buffer = pins.createBuffer(44);
buf[0] = 181
    buf[1] = 98
    buf[2] = 6
    buf[3] = 36
    buf[4] = 36
    buf[5] = 0
    buf[6] = 255
    buf[7] = 255
    buf[8] = 6
    buf[9] = 3
    buf[10] = 0
    buf[11] = 0
    buf[12] = 0
    buf[13] = 0
    buf[14] = 16
    buf[15] = 39
    buf[16] = 0
    buf[17] = 0
    buf[18] = 5
    buf[19] = 0
    buf[20] = 250
    buf[21] = 0
    buf[22] = 250
    buf[23] = 0
    buf[24] = 100
    buf[25] = 0
    buf[26] = 44
    buf[27] = 1
    buf[28] = 0
    buf[29] = 0
    buf[30] = 0
    buf[31] = 0
    buf[32] = 0
    buf[33] = 0
    buf[34] = 0
    buf[35] = 0
    buf[36] = 0
    buf[37] = 0
    buf[38] = 0
    buf[39] = 0
    buf[40] = 0
    buf[41] = 0
    buf[42] = 22
    buf[43] = 220
    // NEO6M_GPS.writeConfig(buf, 44)
    serial.writeBuffer(buf)
}
function Speichern () {
    Qwiic_Openlog.writeString(Laufzeit.toString())
    Qwiic_Openlog.writeString(";" + Uhrzeit.substr(0, 6))
    Qwiic_Openlog.writeString(";" + Laenge)
    Qwiic_Openlog.writeString(";" + Breite)
    Qwiic_Openlog.writeString(";" + Hoehe)
    Qwiic_Openlog.writeString(";" + Temperatur.toString())
    Qwiic_Openlog.writeString(";" + Luftdruck.toString())
    Qwiic_Openlog.writeString(";" + Luftfeuchte.toString())
    Qwiic_Openlog.writeString(";" + Lichtstaerke.toString())
    Qwiic_Openlog.writeString(";" + Ultraviolett.toString())
    Qwiic_Openlog.writeLine(";" + Infrarot.toString())
}
let Hoehe = ""
let Breite = ""
let Laenge = ""
let Uhrzeit = ""
let Arbeiten = false
let Laufzeit = 0
let Infrarot = 0
let Ultraviolett = 0
let Luftfeuchte = 0
let Luftdruck = 0
let Temperatur = 0
let Lichtstaerke = 0
radio.setGroup(1)
radio.setTransmitPower(7)
SI1145.init_SI1145()
bme280.setAddress(BME280_I2C_ADDRESS.ADDR_0x76)
bme280.setPower(true)
NEO6M_GPS.initGPS(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600)
NEO6M_GPS.setGPSFormat(GPS_Format.DEG_DEC)
initFlightMode()
Qwiic_Openlog.createFile("Sonde.log")
Qwiic_Openlog.openFile("Sonde.log")
Arbeiten = true
for (let Warten = 0; Warten <= 9; Warten++) {
    basic.showNumber(9 - Warten)
    basic.pause(1000)
}
Qwiic_Openlog.writeString("Laufzeit;Uhrzeit;Laenge;Breite;Hoehe;")
Qwiic_Openlog.writeString("Temperatur;Luftdruck;Luftfeuchte;")
Qwiic_Openlog.writeLine("Helligkeit;Ultraviolett;Infrarot")
while (true) {
    if (Arbeiten) {
        Messen()
        Speichern()
        Senden()
        basic.pause(800)
        basic.showLeds(`
            . . . . .
            . . . . .
            . . # . .
            . . . . .
            . . . . .
            `)
        basic.pause(200)
        basic.clearScreen()
    } else {
        basic.showIcon(IconNames.Diamond)
        basic.pause(500)
        basic.showIcon(IconNames.SmallDiamond)
        basic.pause(500)
        basic.clearScreen()
    }
}
