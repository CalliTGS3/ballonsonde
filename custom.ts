enum ILLUMINANCE {
    //% block="lx"
    LUX = 1,
    //% block="fc"
    FC = 2
}

/**
 * SI1145 block
 */
//% weight=30 color=#7d6608 icon="\uf0c2"
namespace SI1145 {
    let SI1145_I2C_ADDR = 0x60;

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(SI1145_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.Int16LE);
    }

    function writeParam(p: number, v: number) {
        setreg(0x17, v)
        setreg(0x18, p | 0xA0)
        return getreg(0x2E);
    }

    function reset(): void {
        setreg(0x08, 0x00)
        setreg(0x09, 0x00)
        setreg(0x04, 0x00)
        setreg(0x05, 0x00)
        setreg(0x06, 0x00)
        setreg(0x03, 0x00)
        setreg(0x21, 0xFF)
        setreg(0x18, 0x01)
        basic.pause(10)
        setreg(0x07, 0x17)
        basic.pause(10)
    }

    //% blockId="init_SI1145" block="Initialisiere Lichtmessung"
    export function init_SI1145(): void {
//        let id: number = getreg(0x00)

//        if (id != 0x45) console.log("SI1145 not connected")

        reset()

        // enable UVindex measurement coefficients!
        setreg(0x13, 0x29);
        setreg(0x14, 0x89);
        setreg(0x15, 0x02);
        setreg(0x16, 0x00);

        // enable UV sensor
        writeParam(0x01, 0x80 | 0x20 | 0x10 | 0x01);
        // enable interrupt on every sample
        setreg(0x03, 0x01);
        setreg(0x04, 0x01);


        // program LED current
        setreg(0x0F, 0x03); // 20mA for LED 1 only
        writeParam(0x07, 0x03);
        // prox sensor #1 uses LED #1
        writeParam(0x02, 0x01);
        // fastest clocks, clock div 1
        writeParam(0x0B, 0);
        // take 511 clocks to measure
        writeParam(0x0A, 0x70);
        // in prox mode, high range
        writeParam(0x0C, 0x20 | 0x04);

        writeParam(0x0E, 0x00);
        // fastest clocks, clock div 1
        writeParam(0x1E, 0);
        // take 511 clocks to measure
        writeParam(0x1D, 0x70);
        // in high range mode
        writeParam(0x1F, 0x20);

        // fastest clocks, clock div 1
        writeParam(0x11, 0);
        // take 511 clocks to measure
        writeParam(0x10, 0x70);
        // in high range mode (not normal signal)
        writeParam(0x12, 0x20);

        // measurement rate for auto
        setreg(0x08, 0xFF); // 255 * 31.25uS = 8ms

        // auto run
        setreg(0x18, 0x0F);
    }

    /**
     * Ultra Violet Index
    */
    //% blockId="readUVI" block="Ermittle Ultraviolett Index"
    export function readUVI(): number {
        return (getUInt16LE(0x2C) / 100)
    }

    /**
     *  Ambient Light Intensity
    */
    //% blockId="readLight" block="Ermittle Helligkeit Wert in %unit"
    export function readLight(unit: ILLUMINANCE): number {

        if (unit == ILLUMINANCE.LUX) {
            return getUInt16LE(0x22)
        } else if (unit == ILLUMINANCE.FC) {
            return (getUInt16LE(0x22) / 10764)
        }
        return 0
    }

    /**
     *  Infra Red Intensity
    */
    //% blockId="readIR" block="Ermittle Infrarot Wert"
    export function readIR(): number {
        return getUInt16LE(0x24)
    }

}

/**
 * Sparkfun QWIIC Openlog extension for calliope.
 * I2C interface.
 *  
 * GUIDE: https://learn.sparkfun.com/tutorials/qwiic-openlog-hookup-guide
 *   
 * @author Raik Andritschke
 */

//% weight=5 color=#512e5f icon="\uf0c7"
namespace Qwiic_Openlog {

    let QWIIC_OPENLOG_ADDR = 0x2A;

    const I2C_BUFFER_LENGTH = 32;
    const READ_BUFFER_LENGTH = 256;

    const CR = 13;
    const LF = 10;
    const EOF = 255;

    const STATUS_SD_INIT_GOOD = 1;
    const STATUS_LAST_COMMAND_SUCCESS = 2;
    const STATUS_LAST_COMMAND_KNOWN = 4;
    const STATUS_FILE_OPEN = 8;
    const STATUS_IN_ROOT_DIRECTORY = 16;

    const ID = 0x00;
    const STATUS = 0x01;
    const FIRMWAREMAJOR = 0x02;
    const FIRMWAREMINOR = 0x03;
    const I2CADDRESS = 0x1E;
    const LOGINIT = 0x05;
    const CREATEFILE = 0x06;
    const MKDIR = 0x07;
    const CD = 0x08;
    const READFILE = 0x09;
    const STARTPOSITION = 0x0A;
    const OPENFILE = 0x0B;
    const WRITEFILE = 0x0C;
    const FILESIZE = 0x0D;
    const LIST = 0x0E;
    const RM = 0x0F;
    const RMRF = 0x10;
    const SYNCFILE = 0x11;

    let readBuffer: Buffer = pins.createBuffer(READ_BUFFER_LENGTH)
    let readBufferPtr = 0;

    function readByte(register: number): number {
        let cmd: Buffer = pins.createBuffer(1)
        let temp: Buffer = pins.createBuffer(1)
        cmd[0] = register
        pins.i2cWriteBuffer(QWIIC_OPENLOG_ADDR, cmd, false)
        temp = pins.i2cReadBuffer(QWIIC_OPENLOG_ADDR, 1, false)
        return temp[0]
    }

    function writeByte(register: number, value: number): void {
        let temp: Buffer = pins.createBuffer(2);
        temp[0] = register;
        temp[1] = value;
        pins.i2cWriteBuffer(QWIIC_OPENLOG_ADDR, temp, false);
        basic.pause(15)
    }

    function writeBuffer(register: number, buf: Buffer): void {
        let temp: Buffer = pins.createBuffer(buf.length + 1);
        temp[0] = register;
        for (let i = 0; i < buf.length; i++)
            temp[i + 1] = buf[i]
        pins.i2cWriteBuffer(QWIIC_OPENLOG_ADDR, temp, false);
        basic.pause(15)
    }

    function sendCommandString(cmd: number, s: string): void {
        let temp: Buffer = pins.createBuffer(Math.min(s.length, I2C_BUFFER_LENGTH - 1));
        s = s.substr(0, I2C_BUFFER_LENGTH - 1)
        for (let i = 0; i < s.length; i++) {
            temp.setNumber(NumberFormat.Int8LE, i, s.charCodeAt(i));
        }
        writeBuffer(cmd, temp);
    }

    //% blockId="mkDir" block="Erstelle das Verzeichnis %dir"
    //% advanced=true
    export function mkDir(dir: string): void {
        if (dir == '') return;
        sendCommandString(MKDIR, dir)
        writeByte(SYNCFILE, 0);
    }

    //% blockId="changeDir" block="Wechsle in das Verzeichnis %dir"
    //% advanced=true
    export function changeDir(dir: string): void {
        if (dir == '') return;
        sendCommandString(CD, dir)
        writeByte(SYNCFILE, 0);
    }

    //% blockId="createFile" block="Erstelle die Datei %filename"
    export function createFile(filename: string): void {
        if (filename == '') return;
        sendCommandString(CREATEFILE, filename)
        writeByte(SYNCFILE, 0);
    }

    //% blockId="openFile" block="Öffne die Datei zum Schreiben %filename"
    export function openFile(filename: string): void {
        if (filename == '') return;
        sendCommandString(OPENFILE, filename)
    }

    //% blockId="getStatus" block="Ermittle Status des Moduls"
    //% advanced=true
    export function getStatus(): number {
        return readByte(STATUS)
    }

    //% blockId="getVersion" block="Ermittle Softwareversion des Moduls"
    //% advanced=true
    export function getVersion(): string {
        return readByte(FIRMWAREMAJOR).toString() + '.' + readByte(FIRMWAREMINOR).toString();
    }

    //% blockId="setAddress" block="Setze Adresse des Moduls %addr"
    //% advanced=true
    export function setAddress(addr: number): void {
        QWIIC_OPENLOG_ADDR = addr;
    }

    //% blockId="writeString" block="Schreibe Zeichenkette in Datei %s"
    export function writeString(s: string): void {
        let temp: Buffer = pins.createBuffer(Math.min(s.length, I2C_BUFFER_LENGTH - 1));
        let i: number;
        let ptr: number = 0;
        for (i = 0; i < s.length; i++) {
            temp.setNumber(NumberFormat.Int8LE, ptr, s.charCodeAt(i));
            ptr++;
            if ((ptr == I2C_BUFFER_LENGTH - 1) || (i == s.length - 1)) {
                writeBuffer(WRITEFILE, temp);
                temp.fill(0);
                ptr = 0;
            }
        }
        writeByte(SYNCFILE, 0);
    }

    //% blockId="writeLine" block="Schreibe Zeile in Datei %s"
    export function writeLine(s: string): void {
        writeString(s + String.fromCharCode(CR) + String.fromCharCode(LF));
    }

    //% blockId="writeNumber" block="Schreibe Zahl in Datei %n"
    export function writeNumber(n: number): void {
        writeString(n.toString());
    }

    //% blockId="writeValue" block="Schreibe in Datei Name %s | und Wert %n"
    export function writeValue(s: string, n: number): void {
        writeString(s + ":" + n.toString() + String.fromCharCode(CR) + String.fromCharCode(LF));
    }

    //% blockId="writeStringValue" block="Schreibe in Datei Name %s | und Zeichenkette %z"
    export function writeStringValue(s: string, z: string): void {
        writeString(s + ":" + z + String.fromCharCode(CR) + String.fromCharCode(LF));
    }

}

/**
 * GPS NEO-6M GPS Sensor extension for calliope.
 * Serial interface
 * 
 * @author Raik Andritschke
 */

enum GPS_Format {
    //% block="hddd.ddddd°"
    DEG_DEC,
    //% block="hddd° mm.mmm′"
    DEG_MIN_DEC,
    //% block="hddd° mm′ ss.ss″"
    DEG_MIN_SEC,
    //% block="±ddd.ddddd°"
    SIGNED_DEG_DEC
}

//% weight=20 color=#935116 icon="\uf14e"
// icon="\uf0ac"
namespace NEO6M_GPS {

    let TX = SerialPin.C17;
    let RX = SerialPin.C16;
    let BAUD = BaudRate.BaudRate9600;
    let GPS_FORMAT = GPS_Format.DEG_DEC;
    let received = "";
    let gpgll = "";
    let gpgsv = "";
    let gpgga = "";
    let gpvtg = "";
    let gprmc = "";
    let pubx = "";
    let DEG = "°";
    let MNS = "′";
    let SEC = "″";
    const DEC = ".";
    const UBX_TIMEOUT = 2000; // ms

    // blockId="serial_buffersize" block="serial receive buffer size %size"
    // shim=NEO6M_GPS::setReceiveBufferSize
    function setReceiveBufferSize(size: number) {
        return;
    }

    //% blockId="initGPS" block="Initialisiere Serielle Schnittstelle mit TX Pin %tx | RX Pin %rx | Baudrate %baud"
    //% tx.defl=SerialPin.C17
    //% rx.defl=SerialPin.C16
    //% baud.defl=BaudRate.BaudRate9600
    export function initGPS(tx: SerialPin, rx: SerialPin, baud: BaudRate) {
        // initialize serial port
        TX = tx;
        RX = rx;
        BAUD = baud;
        serial.redirect(TX, RX, BAUD);
        serial.setRxBufferSize(120);
    }

    //% blockId="setGPSUnits" block="Setze GPS Einheiten auf Grad: %deg | Minuten: %mns | Sekunden: %sec"
    //% deg.defl=":"
    //% mns.defl=":"
    //% sec.defl=":"
    export function setGPSUnits(deg: string, mns: string, sec: string) {
        if (deg.length > 0) { DEG = deg.substr(0, 1) }
        if (mns.length > 0) { MNS = mns.substr(0, 1) }
        if (sec.length > 0) { SEC = sec.substr(0, 1) }
    }

    //% blockId="setGPSFormat" block="Setze GPS Format auf %gpsFormat"
    //% gpsFormat.defl="hddd° mm′ ss.ss″"
    export function setGPSFormat(gpsFormat: GPS_Format) {
        GPS_FORMAT = gpsFormat;
    }

    // string => array of strings
    function string2array(s: string, delimiter: string): Array<string> {
        let line = "";
        let received_array: Array<string> = [];
        if (s.length > 0) {
            for (let i = 0; i <= s.length; i++) {
                if ((s.charAt(i) == delimiter) || (i == s.length)) {
                    received_array.push(line);
                    line = "";
                } else {
                    line = line + s.charAt(i);
                }
            }
        }
        return received_array;
    }

    // serial event handler 
    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
        received = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (received.length > 0) {
            if (received.substr(1, 5) == "GPGLL") {
                gpgll = received.substr(7, received.length - 7)
            }
            if (received.substr(1, 5) == "GPGSV") {
                gpgsv = received.substr(7, received.length - 7)
            }
            if (received.substr(1, 5) == "GPGGA") {
                gpgga = received.substr(7, received.length - 7)
            }
            if (received.substr(1, 5) == "GPVTG") {
                gpvtg = received.substr(7, received.length - 7)
            }
            if (received.substr(1, 5) == "GPRMC") {
                gprmc = received.substr(7, received.length - 7)
            }
            if (received.substr(1, 4) == "PUBX") {
                pubx = received.substr(6, received.length - 6)
            }
        }
    })

    //% blockId="getGPSReceived" block="Lese empfangene Zeichenkette"
    //% advanced=true
    export function getGPSReceived(): string {
        return received;
    }

    //% blockId="getGPGLL" block="Lese GPGLL"
    //% advanced=true
    export function getGPGLL(): Array<string> {
        return string2array(gpgll, ",");
    }

    //% blockId="getGPGSV" block="Lese GPGSV"
    //% advanced=true
    export function getGPGSV(): Array<string> {
        return string2array(gpgsv, ",");
    }

    //% blockId="getGPGGA" block="Lese GPGGA"
    //% advanced=true
    export function getGPGGA(): Array<string> {
        return string2array(gpgga, ",");
    }

    //% blockId="getGPGGAString" block="Lese GPGGA Zeichenkette"
    //% advanced=true
    export function getGPGGAString(): string {
        return gpgga;
    }

    //% blockId="getGPVTG" block="Lese GPVTG"
    //% advanced=true
    export function getGPVTG(): Array<string> {
        return string2array(gpvtg, ",");
    }

    //% blockId="getGPRMC" block="Lese GPRMC"
    //% advanced=true
    export function getGPRMC(): Array<string> {
        return string2array(gprmc, ",");
    }

    //% blockId="getGPRMCString" block="Lese GPRMC Zeichenkette"
    //% advanced=true
    export function getGPRMCString(): string {
        return gprmc;
    }

    //% blockId="getGPSTime" block="Lese Satelliten Uhrzeit"
    export function getGPSTime(): string {
        if ((gpgga.length > 0) && (getGPGGA().length > 0) && (getGPGGA().get(0))) {
            return getGPGGA().get(0);
        } else {
            return "";
        }
    }

    //% blockId="getGPSFix" block="Lese GPS Fix"
    export function getGPSFix(): boolean {
        if ((gpgga.length > 0) && (getGPGGA().length > 0) && (getGPGGA().get(5))) {
            return (getGPGGA().get(5) == "1");
        } else {
            return false;
        }
    }

    //% blockId="getGPSCountSat" block="Lese Anzahl der Satelliten"
    export function getGPSCountSat(): number {
        if ((gpgga.length > 0) && (getGPGGA().length > 0) && (getGPGGA().get(6))) {
            return parseInt(getGPGGA().get(6));
        } else {
            return 0;
        }
    }

    //% blockId="getGPSAltitude" block="Lese Höhe"
    export function getAltitude(): string {
        if ((gpgga.length > 0) && (getGPGGA().length > 0) && (getGPGGA().get(8))) {
            return getGPGGA().get(8);
        } else {
            return "";
        }
    }

    //% blockId="getGPSSpeed" block="Lese Geschwindigkeit"
    export function getGPSSpeed(): string {
        if ((gprmc.length > 0) && (getGPRMC().length > 0) && (getGPRMC().get(6))) {
            return getGPRMC().get(6);
        } else {
            return "";
        }
    }

    //% blockId="getGPSTrackAngle" block="Lese Bewegungswinkel"
    export function getGPSTrackAngle(): string {
        if ((gprmc.length > 0) && (getGPRMC().length > 0) && (getGPRMC().get(7))) {
            return getGPRMC().get(7);
        } else {
            return "";
        }
    }

    // Formatted GPS
    function getFormattedGPS(gpsFormat: GPS_Format, dir: string, deg: number, mns: number, sec: string): string {
        // complex calculation because of missing float type
        let ret = "";
        let seclen = sec.length;
        let secint = parseInt(sec);
        let shiftedmin = (mns * Math.pow(10, seclen) + secint) / 60;
        let shiftedminstr = shiftedmin.toString()
	// remove decimal places in case of float return by division
	shiftedminstr = parseInt(shiftedminstr).toString();
        if (shiftedminstr.length < 5) { shiftedminstr = "0" + shiftedminstr }
        switch (gpsFormat) {
            case GPS_Format.DEG_DEC: // (hddd.ddddd°)
                // mm.mmmmm / 60
                return dir + deg.toString() + DEC + shiftedminstr.substr(0, 5) + DEG;
            case GPS_Format.DEG_MIN_SEC: // (hddd° mm′ ss.ss″)
                // mmmmm * 60
                return dir + deg.toString() + DEG + mns.toString() + MNS + (secint * 60).toString().substr(0, 2) + DEC + (secint * 60).toString().substr(2, 5) + SEC;
            case GPS_Format.DEG_MIN_DEC: // (hddd° mm.mmm′)
                // only formatting
                return dir + deg.toString() + DEG + mns.toString() + DEC + sec.substr(0) + MNS;
            case GPS_Format.SIGNED_DEG_DEC: // (±ddd.ddddd°)
                // mm.mmmmm / 60
                ret = deg.toString() + DEC + shiftedminstr.substr(0, 5) + DEG;
                if (dir == "N") {
                    return "Lat=" + ret;
                } else if (dir == "S") {
                    return "Lat=-" + ret;
                } else if (dir == "E") {
                    return "Long=" + ret;
                } else if (dir == "W") {
                    return "Long=-" + ret;
                }
            default:
                return "";
        }
    }

    //% blockId="getGPSLatitude" block="Lese Geographische Länge"
    //% expandableArgumentMode="toggle"
    export function getGPSLatitude(gpsFormat?: GPS_Format): string {
        if (!gpsFormat) { gpsFormat = GPS_FORMAT }
        if ((gpgga.length > 0) && (getGPGGA().length > 0) && (getGPGGA().get(1)) && (getGPGGA().get(2))) {
            // (1) ddmm.mmmmm
            // (2) N/S
            let lat = getGPGGA().get(1);
            let dir = getGPGGA().get(2);
            let deg = 0;
            let mns = 0;
            let sec = "";
            let splitted = string2array(lat, '.');
            switch (splitted.get(0).length) {
                case 4:
                    deg = parseInt(splitted.get(0).substr(0, 2));
                    mns = parseInt(splitted.get(0).substr(2));
                    break;
                case 3:
                    deg = parseInt(splitted.get(0).substr(0, 1));
                    mns = parseInt(splitted.get(0).substr(1));
                    break;
                default:
                    deg = 0;
                    mns = 0;
            }
            sec = splitted.get(1);
            return getFormattedGPS(gpsFormat, dir, deg, mns, sec);
        } else {
            return "";
        }
    }

    //% blockId="getGPSLongitude" block="Lese Geographische Breite"
    //% expandableArgumentMode="toggle"
    export function getGPSLongitude(gpsFormat?: GPS_Format): string {
        if (!gpsFormat) { gpsFormat = GPS_FORMAT }
        if ((gpgga.length > 0) && (getGPGGA().length > 0) && (getGPGGA().get(3)) && (getGPGGA().get(4))) {
            // (3) ddmm.mmmmm
            // (4) E/W
            let long = getGPGGA().get(3);
            let dir = getGPGGA().get(4);
            let deg = 0;
            let mns = 0;
            let sec = "";
            let splitted = string2array(long, '.');
            switch (splitted.get(0).length) {
                case 5:
                    deg = parseInt(splitted.get(0).substr(0, 3));
                    mns = parseInt(splitted.get(0).substr(3));
                    break;
                case 4:
                    deg = parseInt(splitted.get(0).substr(0, 2));
                    mns = parseInt(splitted.get(0).substr(2));
                    break;
                case 3:
                    deg = parseInt(splitted.get(0).substr(0, 1));
                    mns = parseInt(splitted.get(0).substr(1));
                    break;
                default:
                    deg = 0;
                    mns = 0;
            }
            sec = splitted.get(1);
            return getFormattedGPS(gpsFormat, dir, deg, mns, sec);
        } else {
            return "";
        }
    }

    //% blockId="getGPSGoogleDMS" block="Lese Google Koordinaten im Format GMS"
    export function getGPSGoogleDMS(): string {
        // gg°mm'ss.ss"h gg°mm'ss.ss"h
        let latitude = getGPSLatitude(GPS_Format.DEG_MIN_SEC);
        let longitude = getGPSLongitude(GPS_Format.DEG_MIN_SEC);
        if (latitude && longitude) {
            return latitude.substr(1) + latitude.substr(0, 1) + " " + longitude.substr(1) + longitude.substr(0, 1);
        }
        return "";
    }

    //% blockId="getGPSGoogleDD" block="Lese Google Koordinaten im Format G"
    export function getGPSGoogleDD(): string {
        // gg.ddddd, gg.ddddd
        let latitude = getGPSLatitude(GPS_Format.DEG_DEC);
        let longitude = getGPSLongitude(GPS_Format.DEG_DEC);
        if (latitude && longitude) {
            return latitude.substr(1) + ", " + longitude.substr(1);
        }
        return "";
    }
    
}

/**
 * makecode BME280 digital pressure and humidity sensor Package.
 * From microbit/micropython Chinese community.
 * http://www.micropython.org.cn
 * 
 * Modified for SAMD21: Andrés Sabas @ Electronic Cats  
 * Date:   Octuber 2018 
 * 
 * https://github.com/ElectronicCats
 * 
 * Development environment specifics:
 * Written in Microsoft PXT
 * Tested with a CatSatZero
 *
 * This code is released under the [MIT License](http://opensource.org/licenses/MIT).
 * Please review the LICENSE.md file included with this example. If you have any questions 
 * or concerns with licensing, please contact soporte@electroniccats.com.
 * Distributed as-is; no warranty is given.
 */

enum BME280_I2C_ADDRESS {
    //% block="0x76"
    ADDR_0x76 = 0x76,
    //% block="0x77"
    ADDR_0x77 = 0x77
}

/**
 * BME280 block
 */
//% weight=100 color=#70c0f0 icon="\uf042" block="BME280"
namespace bme280 {
    let bmeAddr = 0;
    let dig_T1: number;
    let dig_T2: number;
    let dig_T3: number;
    let dig_P1: number;
    let dig_P2: number;
    let dig_P3: number;
    let dig_P4: number;
    let dig_P5: number;
    let dig_P6: number;
    let dig_P7: number;
    let dig_P8: number;
    let dig_P9: number;
    let dig_H1: number;
    let dig_H2: number;
    let dig_H3: number;
    let a: number;
    let dig_H4: number;
    let dig_H5: number;
    let dig_H6: number;
    let T = 0;
    let P = 0;
    let H = 0;

    function init() {
        dig_T1 = getUInt16LE(0x88)
        dig_T2 = getInt16LE(0x8A)
        dig_T3 = getInt16LE(0x8C)
        dig_P1 = getUInt16LE(0x8E)
        dig_P2 = getInt16LE(0x90)
        dig_P3 = getInt16LE(0x92)
        dig_P4 = getInt16LE(0x94)
        dig_P5 = getInt16LE(0x96)
        dig_P6 = getInt16LE(0x98)
        dig_P7 = getInt16LE(0x9A)
        dig_P8 = getInt16LE(0x9C)
        dig_P9 = getInt16LE(0x9E)
        dig_H1 = getreg(0xA1)
        dig_H2 = getInt16LE(0xE1)
        dig_H3 = getreg(0xE3)
        a = getreg(0xE5)
        dig_H4 = (getreg(0xE4) << 4) + (a % 16)
        dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
        dig_H6 = getInt8LE(0xE7)
        setreg(0xF2, 0x04)
        setreg(0xF4, 0x2F)
        setreg(0xF5, 0x0C)
        T = 0
        P = 0
        H = 0
    }

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(bmeAddr, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.Int16LE);
    }

    function get(): void {
        if (!bmeAddr) {  // lazy init
            bmeAddr = BME280_I2C_ADDRESS.ADDR_0x76;
            init();
        }
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = (_p / var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024
    }

    /**
     * get pressure
     */
    //% blockId="BME280_PRESSURE" block="pressure"
    //% weight=80 blockGap=8
    //% parts=bme280 trackArgs=0
    export function pressure(): number {
        get();
        return P;
    }

    /**
     * get temperature
     */
    //% blockId="BME280_TEMPERATURE" block="temperature"
    //% weight=80 blockGap=8
    //% parts=bme280 trackArgs=0
    export function temperature(): number {
        get();
        return T;
    }

    /**
     * get humidity
     */
    //% blockId="BME280_HUMIDITY" block="humidity"
    //% weight=80 blockGap=8
    //% parts=bme280 trackArgs=0
    export function humidity(): number {
        get();
        return H;
    }

    /**
     * power on
     */
    //% blockId="BME280_SET_POWER" block="set power $on"
    //% on.shadow=toggleOnOff
    //% weight=61 blockGap=8
    //% parts=bme280 trackArgs=0
    export function setPower(on: boolean) {
        setreg(0xF4, 0x2F)
    }

    /**
     * set I2C address
     */
    //% blockId="BME280_SET_ADDRESS" block="set address %addr"
    //% weight=50 blockGap=8
    //% parts=bme280 trackArgs=0
    export function setAddress(addr: BME280_I2C_ADDRESS) {
        if (bmeAddr != addr) {
            bmeAddr = addr
            init();
        }
    }
}
