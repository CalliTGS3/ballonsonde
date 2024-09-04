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
    Breite = NEO6M_GPS.getGPSLongitude()
    Breite = NEO6M_GPS.getGPSLongitude()
    Laenge = NEO6M_GPS.getGPSLatitude()
    Temperatur = bme280.temperature()
    Lichtstaerke = SI1145.readLight(ILLUMINANCE.LUX)
}
input.onButtonPressed(Button.A, function () {
    Arbeiten = true
})
input.onButtonPressed(Button.B, function () {
    Arbeiten = false
})
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
