// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

if (typeof AXCVR === "undefined" || AXCVR === null) {
    AXCVR = {};

    AXCVR.TRANSFER_RATE = 4;

    AXCVR.pitch = {};

    AXCVR._audioCtx = null;
    AXCVR._current = null;
    AXCVR._microphoneStream = null;
    AXCVR._analyserNode = null;
    AXCVR._audioData = null;
    AXCVR._corrolatedSignal = null;
    AXCVR._localMaxima = null;
    AXCVR._frequencyDisplayElement = null;

    AXCVR.download = function download(filename) {
        const json = {
            frequency: AXCVR.pitch.current()
        };
        const data = JSON.stringify(json);
        const type = "text/plain";
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
            url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(
                function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                },
                0
            );
        }
    }

    AXCVR.pitch.current = function current() {
        return AXCVR.pitch._current;
    }

    AXCVR.pitch.isInitialized = function isInitialized() {
        return AXCVR._audioCtx !== null;
    }

    AXCVR.pitch.initialize = function initialize(audioCtx) {
        if (AXCVR.pitch.isInitialized()) return;
        // AXCVR._audioCtx = typeof audioCtx === "object" ? audioCtx : (new (window.AudioContext || window.webkitAudioContext)());
        AXCVR._audioCtx = audioCtx;
        AXCVR._microphoneStream = null;
        AXCVR._analyserNode = AXCVR._audioCtx.createAnalyser()
        AXCVR._audioData = new Float32Array(AXCVR._analyserNode.fftSize);;
        AXCVR._corrolatedSignal = new Float32Array(AXCVR._analyserNode.fftSize);;
        AXCVR._localMaxima = new Array(10);
        AXCVR._frequencyDisplayElement = document.querySelector('#frequency');
    }

    AXCVR.pitch.startDetection = function startDetection(audioCtx, protocolVersion)
    {
        AXCVR.pitch.initialize(audioCtx);
        navigator.mediaDevices.getUserMedia ({audio: true})
            .then((stream) =>
            {
                AXCVR._microphoneStream = AXCVR._audioCtx.createMediaStreamSource(stream);
                AXCVR._microphoneStream.connect(AXCVR._analyserNode);

                AXCVR._audioData = new Float32Array(AXCVR._analyserNode.fftSize);
                AXCVR._corrolatedSignal = new Float32Array(AXCVR._analyserNode.fftSize);

                setInterval(() => {
                    AXCVR._analyserNode.getFloatTimeDomainData(AXCVR._audioData);

                    let pitch = AXCVR.pitch.getAutocorrolated();

                    pitch = Math.round(pitch);

                    AXCVR.pitch._current = pitch;

                    // let channel = NaN;
                    let channel = Channel.fromFrequency(pitch, protocolVersion);

                    AXCVR._frequencyDisplayElement.innerHTML = `${channel.index}`;
                }, AXCVR.TRANSFER_RATE);
            })
            .catch((err) =>
            {
                console.log(err);
            });
    }

    AXCVR.pitch.getAutocorrolated = function getAutocorrolated()
    {
        // First: autocorrolate the signal

        let maximaCount = 0;

        for (let l = 0; l < AXCVR._analyserNode.fftSize; l++) {
            AXCVR._corrolatedSignal[l] = 0;
            for (let i = 0; i < AXCVR._analyserNode.fftSize - l; i++) {
                AXCVR._corrolatedSignal[l] += AXCVR._audioData[i] * AXCVR._audioData[i + l];
            }
            if (l > 1) {
                if ((AXCVR._corrolatedSignal[l - 2] - AXCVR._corrolatedSignal[l - 1]) < 0
                    && (AXCVR._corrolatedSignal[l - 1] - AXCVR._corrolatedSignal[l]) > 0) {
                    AXCVR._localMaxima[maximaCount] = (l - 1);
                    maximaCount++;
                    if ((maximaCount >= AXCVR._localMaxima.length))
                        break;
                }
            }
        }

        // Second: find the average distance in samples between maxima

        let maximaMean = AXCVR._localMaxima[0];

        for (let i = 1; i < maximaCount; i++)
            maximaMean += AXCVR._localMaxima[i] - AXCVR._localMaxima[i - 1];

        maximaMean /= maximaCount;

        return AXCVR._audioCtx.sampleRate / maximaMean;
    }
}
else console.log("AXCVR already provided.");

function getProtocolVersionString(protocolVersion) {
    if (typeof(protocolVersion) === "string") return protocolVersion;
    return "v" + protocolVersion;
}

const AXCVR_PROTOCOL_VERSION_DEFAULT = "v4";

AXCVR.PROTOCOL_VERSION_DEFAULT = AXCVR_PROTOCOL_VERSION_DEFAULT

class Channel {
    #index = 0;
    #frequency = 0;

    static #frequencies = {
        /**
         * AXCVRP v0
         *
         * Range: `17.778` kHz <-> `18.462` kHz
         *
         * Channels:
         * * `17.778` kHz (near-ultrasonic)
         * * `18.462` kHz (near-ultrasonic)
         *
         * AXCVP v0 is designed for personal-use.
         *
         * v0 is an improvement upon v1, opting for `18.462` kHz for its increased accuracy when compared to `19.2` kHz.
         * The `19.2` kHz is frequency is still useful, however, in applications where `18.462` kHz is too low (and noise-poluting).
         * Research into the health impact of the frequency range used in `v0` compared with the range used in `v1` is still underway.
         */
        v0: {
            18462:  0b0,    // near-ultrasonic
            17778:  0b1     // near-ultrasonic
        },

        /**
         * AXCVRP v00
         *
         * Range: `18.462` kHz <-> `19.2` kHz
         *
         * Channels:
         * * `18.462` kHz (near-ultrasonic)
         * * `19.2` kHz (near-ultrasonic)
         *
         * v00 is designed for personal-use.
         *
         * v00 is an improvement upon v0, opting for `19.2` kHz for its reduced noise-polution footprint when compared to `18.462`, `17.778`, and `17.143` kHz.
         * This makes it more ideal for quiet spaces, such as homes (and possibly even hospitals after thorough lab-testing has been done and approval has been granted).
         */
        v00: {
            19200:  0b0,    // near-ultrasonic
            18462:  0b1     // near-ultrasonic
        },

        /**
         * AXCVRP v00
         *
         * Range: `18.462` kHz <-> `19.2` kHz
         *
         * Channels:
         * * `18.462` kHz (near-ultrasonic)
         * * `19.2` kHz (near-ultrasonic)
         *
         * v00 is designed for personal-use.
         *
         * v00 is an improvement upon v0, opting for `19.2` kHz for its reduced noise-polution footprint when compared to `18.462`, `17.778`, and `17.143` kHz.
         * This makes it more ideal for quiet spaces, such as homes (and possibly even hospitals after thorough lab-testing has been done and approval has been granted).
         */
        v000: {
            20000:  0b00,    // ultrasonic
            19200:  0b01,    // near-ultrasonic
            18462:  0b10,    // near-ultrasonic
            17778:  0b11,    // near-ultrasonic
        },

        /**
         * AXCVRP v1
         *
         * AXCVRP v1 is designed for personal-use.
         *
         * Range: `17.143` kHz <-> `17.778` kHz
         *
         * Channels:
         * * `17.143` kHz (headache)
         * * `17.778` kHz (safe)
         */
        v1: {
            17778:  0b0,    // safe
            17143:  0b1,    // headache
        },

        /**
         * AXCVRP v2
         *
         * AXCVRP v2 is designed for commercial-use.
         *
         * Range: `16` kHz <-> `18.462` kHz
         *
         * Channels:
         * * `16` kHz (headache)
         * * `17.143` kHz (headache)
         * * `17.778` kHz (safe)
         * * `18.462` kHz (safe)
         */
        v2: {
            18462:  0b00,   // safe
            17778:  0b01,   // safe
            17143:  0b10,   // headache
            16000:  0b11,   // headache
        },

        /**
         * AXCVRP v3
         *
         * AXCVRP v3 is designed for industrial-use and research.
         *
         * Range: `11.163` kHz <-> `18.462` kHz
         *
         * Channels:
         * * `11.163` kHz (auditoxicosis)
         * * `12` kHz (headache)
         * * `12.308` kHz (headache)
         * * `15` kHz (headache)
         * * `16` kHz (headache)
         * * `17.143` kHz (headache)
         * * `17.778` kHz (safe)
         * * `18.462` kHz (safe)
         */
        v3: {
            18462:  0b000,  // safe
            17778:  0b001,  // safe
            17143:  0b010,  // headache
            16000:  0b011,  // headache
            15000:  0b100,  // headache
            12308:  0b101,  // headache
            12000:  0b110,  // headache
            11163:  0b111,  // audiotoxicosis
        },

        /**
         * AXCVRP v4
         *
         * AXCVRP v4 is designed for industrial-use and research.
         *
         * Range: `9.231` kHz <-> `19.2` kHz
         *
         * Channels:
         * * `9.231` kHz (auditoxicosis)
         * * `9.412` kHz (auditoxicosis)
         * * `9.6` kHz (auditoxicosis)
         * * `9.796` kHz (auditoxicosis)
         * * `10.213` kHz (auditoxicosis)
         * * `10.435` kHz (auditoxicosis)
         * * `10.667` kHz (auditoxicosis)
         * * `11.163` kHz (auditoxicosis)
         * * `12` kHz (headache)
         * * `12.308` kHz (headache)
         * * `15` kHz (headache)
         * * `16` kHz (headache)
         * * `17.143` kHz (headache)
         * * `17.778` kHz (safe)
         * * `18.462` kHz (safe)
         */
        v4: {
            19200:  0b0000, // safe
            18462:  0b0001, // safe
            17778:  0b0010, // safe
            17143:  0b0011, // headache
            16000:  0b0100, // headache
            15000:  0b0101, // headache
            12308:  0b0110, // headache
            12000:  0b0111, // headache
            11163:  0b1000, // auditoxicosis
            10667:  0b1001, // auditoxicosis
            10435:  0b1010, // auditoxicosis
            10213:  0b1011, // auditoxicosis
            9796:   0b1100, // auditoxicosis
            9600:   0b1101, // auditoxicosis
            9412:   0b1110, // auditoxicosis
            9231:   0b1111, // auditoxicosis
        },

        /**
         * AXCVRP v5
         *
         * AXCVRP v5 is designed for industrial-use and research.
         *
         * Range: `5.854` kHz <-> `19.2` kHz
         *
         * Channels:
         * * `5.854` kHz [strong]
         * * `5.926` kHz [strong]
         * * `6.076` kHz (ear ache)
         * * `6.234` kHz (untested)
         * * `6.316` kHz (ear ache)
         * * `6.486` kHz (ear ache)
         * * `6.667` kHz (ear ache)
         * * `6.761` kHz (ear ache)
         * * `6.857` kHz (auditoxicosis)
         * * `6.957` kHz (auditoxicosis)
         * * `8.000` kHz (auditoxicosis)
         * * `8.136` kHz (auditoxicosis)
         * * `8.421` kHz (auditoxicosis)
         * * `8.571` kHz (auditoxicosis)
         * * `8.727` kHz (auditoxicosis)
         * * `8.889` kHz (auditoxicosis)
         * * `9.057` kHz (auditoxicosis)
         * * `9.231` kHz (auditoxicosis)
         * * `9.412` kHz (auditoxicosis)
         * * `9.6` kHz (auditoxicosis)
         * * `9.796` kHz (auditoxicosis)
         * * `10.213` kHz (auditoxicosis)
         * * `10.435` kHz (auditoxicosis)
         * * `10.667` kHz (auditoxicosis)
         * * `11.163` kHz (audiotoxicosis)
         * * `12` kHz (headache)
         * * `12.308` kHz (headache)
         * * `15` kHz (headache)
         * * `16` kHz (headache)
         * * `17.143` kHz (headache)
         * * `17.778` kHz (safe)
         * * `18.462` kHz (safe)
         * * `19.2` kHz (safe)
         */
        v5: {
            5854:   0b11111,    // [strong]
            5926:   0b11110,    // [strong]
            6076:   0b11101,    // ear ache
            6234:   0b11100,    // untested
            6316:   0b11100,    // ear ache
            6486:   0b11011,    // ear ache
            6667:   0b11010,    // ear ache
            6761:   0b11001,    // ear ache
            6857:   0b11000,    // auditoxicosis
            6957:   0b10111,    // auditoxicosis
            8000:   0b10110,    // auditoxicosis
            8136:   0b10101,    // auditoxicosis
            8421:   0b10100,    // auditoxicosis
            8571:   0b10011,    // auditoxicosis
            8727:   0b10010,    // auditoxicosis
            8889:   0b10001,    // auditoxicosis
            9057:   0b10000,    // auditoxicosis
            9231:   0b01111,    // auditoxicosis
            9412:   0b01110,    // auditoxicosis
            9600:   0b01101,    // auditoxicosis
            9796:   0b01100,    // auditoxicosis
            10213:  0b01011,    // auditoxicosis
            10435:  0b01010,    // auditoxicosis
            10667:  0b01001,    // auditoxicosis
            11163:  0b01000,    // auditoxicosis
            12000:  0b00111,    // headache
            12308:  0b00110,    // headache
            15000:  0b00101,    // headache
            16000:  0b00100,    // headache
            17143:  0b00011,    // headache
            17778:  0b00010,    // safe
            18462:  0b00001,    // safe
            19200:  0b00000     // safe
        },

        /**
         * AXCVRP v6 (WIP)
         *
         * AXCVRP v6 is designed for industrial-use and research.
         *
         * Range: `5.854` kHz <-> `19.2` kHz
         *
         * Channels:
         * * `5.854` kHz [strong]
         * * `5.926` kHz [strong]
         * * `6.076` kHz (ear ache)
         * * `6.234` kHz (untested)
         * * `6.316` kHz (ear ache)
         * * `6.486` kHz (ear ache)
         * * `6.667` kHz (ear ache)
         * * `6.761` kHz (ear ache)
         * * `6.857` kHz (auditoxicosis)
         * * `6.957` kHz (auditoxicosis)
         * * `8.000` kHz (auditoxicosis)
         * * `8.136` kHz (auditoxicosis)
         * * `8.421` kHz (auditoxicosis)
         * * `8.571` kHz (auditoxicosis)
         * * `8.727` kHz (auditoxicosis)
         * * `8.889` kHz (auditoxicosis)
         * * `9.057` kHz (auditoxicosis)
         * * `9.231` kHz (auditoxicosis)
         * * `9.412` kHz (auditoxicosis)
         * * `9.6` kHz (auditoxicosis)
         * * `9.796` kHz (auditoxicosis)
         * * `10.213` kHz (auditoxicosis)
         * * `10.435` kHz (auditoxicosis)
         * * `10.667` kHz (auditoxicosis)
         * * `11.163` kHz (audiotoxicosis)
         * * `12` kHz (headache)
         * * `12.308` kHz (headache)
         * * `15` kHz (headache)
         * * `16` kHz (headache)
         * * `17.143` kHz (headache)
         * * `17.778` kHz (safe)
         * * `18.462` kHz (safe)
         * * `19.2` kHz (safe)
         */
        v6: {
            5581:   0b100100,   // untested
            5600:   0b100011,   // untested
            5647:   0b100010,   // [weak]
            5714:   0b100001,   // [medium-strong]
            5783:   0b100000,   // [medium-strong]
            5854:   0b011111,    // [strong]
            5926:   0b011110,    // [strong]
            6076:   0b011101,    // ear ache
            6234:   0b011100,    // untested
            6316:   0b011100,    // ear ache
            6486:   0b011011,    // ear ache
            6667:   0b011010,    // ear ache
            6761:   0b011001,    // ear ache
            6857:   0b011000,    // auditoxicosis
            6957:   0b010111,    // auditoxicosis
            8000:   0b010110,    // auditoxicosis
            8136:   0b010101,    // auditoxicosis
            8421:   0b010100,    // auditoxicosis
            8571:   0b010011,    // auditoxicosis
            8727:   0b010010,    // auditoxicosis
            8889:   0b010001,    // auditoxicosis
            9057:   0b010000,    // auditoxicosis
            9231:   0b001111,    // auditoxicosis
            9412:   0b001110,    // auditoxicosis
            9600:   0b001101,    // auditoxicosis
            9796:   0b001100,    // auditoxicosis
            10213:  0b001011,    // auditoxicosis
            10435:  0b001010,    // auditoxicosis
            10667:  0b001001,    // auditoxicosis
            11163:  0b001000,    // auditoxicosis
            12000:  0b000111,    // headache
            12308:  0b000110,    // headache
            15000:  0b000101,    // headache
            16000:  0b000100,    // headache
            17143:  0b000011,    // headache
            17778:  0b000010,    // safe
            18462:  0b000001,    // safe
            19200:  0b000000     // safe
        }
    }

    static get FREQUENCY_EPSILON() {
        return 50;
    }

    static count(protocolVersion) {
        return Object.keys(Channel.frequencies(getProtocolVersionString(protocolVersion))).length ?? 0;
    }

    static frequencies(protocolVersion) {
        return Channel.#frequencies[getProtocolVersionString(protocolVersion)];
    }

    get frequency() {
        return this.#frequency;
    }

    get index() {
        return this.#index;
    }

    constructor(index, frequency) {
        this.#index = index;
        this.#frequency = frequency;
    }

    static frequencyFromChannelIndex(channelIndex, protocolVersion) {
        const frequencies = Channel.frequencies(getProtocolVersionString(protocolVersion));
        let frequency = Object.keys(frequencies)[channelIndex];

        return frequency;
    }

    static fromFrequency(frequency, protocolVersion) {
        let maxChannelIndex = Channel.count(protocolVersion) - 1;
        let channelIndex = maxChannelIndex;
        let channelFrequency = 0;

        const getChannelFrequency = function () {
            return Channel.frequencyFromChannelIndex(channelIndex, protocolVersion);
        }

        channelFrequency = getChannelFrequency();

        let approximateFrequency = frequency + Channel.FREQUENCY_EPSILON;

        for (channelIndex = maxChannelIndex; channelIndex >= 0 && ((channelFrequency = getChannelFrequency()) > approximateFrequency); channelIndex--) {}

        if (channelFrequency < 0) channelFrequency = NaN;
        if (channelIndex < 0) channelIndex = NaN;

        return new Channel(channelIndex, channelFrequency);
    }
}

AXCVR.Version = class Version {
    #major = 0;
    #minor = 0;
    #patch = 0;
    #frequencies = {};

    constructor(major, minor, patch) {
        if (typeof major !== "number") major = 1;
        if (typeof minor !== "number") minor = 0;
        if (typeof patch !== "number") patch = 0;
        this.#major = major;
        this.#minor = minor;
        this.#patch = patch;
    }

    getFrequency(name) {
        return this.#frequencies[name];
    }
}

// v1

/// AIP v1.0.0
AXCVR.v1_0_0 = new AXCVR.Version(1, 0, 0);
AXCVR.v1_0 = AXCVR.v1_0_0;
AXCVR.v1 = AXCVR.v1_0;
AXCVR.VERSION_DEFAULT = AXCVR.v1;

AXCVR.Transmitter = class Transmitter {
    #version = new AXCVR.Version(1);

    get version() {
        return this.#version;
    }

    constructor() {
        thsi .#version = AXCVR.VERSION_DEFAULT;
    }

    getFrequency(name) {
        return this.version[name];
    }
}
