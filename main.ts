function Senden () {
    radio.sendString("UZ:" + Uhrzeit)
    radio.sendString("TE:" + Temperatur)
    radio.sendString("LA:" + Laenge)
    radio.sendString("BR:" + Breite)
    radio.sendString("HO:" + Hoehe)
}
function Messen () {
    Uhrzeit = NEO6M_GPS.getGPSTime()
    Hoehe = NEO6M_GPS.getAltitude()
    Laenge = NEO6M_GPS.getGPSLongitude()
    Breite = NEO6M_GPS.getGPSLatitude()
    Temperatur = bme280.temperature()
    Lichtstaerke = SI1145.readLight(ILLUMINANCE.LUX)
}
input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    Arbeiten = true
})
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    Arbeiten = false
})
// NEO6M_GPS.writeConfig(buf)
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
    serial.writeBuffer(buf)
}
function Speichern () {
    Qwiic_Openlog.writeStringValue("Uhrzeit", Uhrzeit)
    Qwiic_Openlog.writeStringValue("Länge", Laenge)
    Qwiic_Openlog.writeStringValue("Breite", Breite)
    Qwiic_Openlog.writeStringValue("Höhe", Hoehe)
    Qwiic_Openlog.writeValue("Temperatur", Temperatur)
    Qwiic_Openlog.writeValue("Lichtstärke", Lichtstaerke)
}
let Hoehe = ""
let Breite = ""
let Laenge = ""
let Uhrzeit = ""
let Arbeiten = false
let Temperatur = 0
let Lichtstaerke = 0
Lichtstaerke = 0
Temperatur = 0
radio.setGroup(1)
radio.setTransmitPower(7)
SI1145.init_SI1145()
bme280.setAddress(BME280_I2C_ADDRESS.ADDR_0x76)
bme280.setPower(true)
NEO6M_GPS.initGPS(SerialPin.C17, SerialPin.C16, BaudRate.BaudRate9600)
NEO6M_GPS.setGPSFormat(GPS_Format.SIGNED_DEG_DEC)
initFlightMode()
Qwiic_Openlog.createFile("Sonde11.log")
Qwiic_Openlog.openFile("Sonde11.log")
while (true) {
    if (Arbeiten) {
        Messen()
        Speichern()
        Senden()
        basic.pause(500)
        basic.showIcon(IconNames.ArrowEast)
        basic.pause(500)
        basic.clearScreen()
    } else {
        basic.pause(500)
        basic.showIcon(IconNames.ArrowWest)
        basic.pause(500)
        basic.clearScreen()
    }
}
