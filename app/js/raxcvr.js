class RAXCVR {
    static #current;
    static #version = "v4";

    static get current() {
        return (RAXCVR.#current = AXCVR.pitch.current());
    }

    static get frequencies() {
        return Object.keys(AXCVR.frequencies[RAXCVR.version]);
    }

    static get version() {
        return RAXCVR.#version;
    }

    static set version(value) {
        RAXCVR.#version = value;
    }

    static buildPacket(packet) {
        const dataBytes = Uint8Array.from(str, char => char.charCodeAt(0));
        const dataEncoded = RAXCVR.encodePacketBytes(dataBytes);
    }

    static encodePacketByte(byte) {
        const encoded = [];
        // const frequencies = AXCVR.
        let bitIndex = 0;
        let bit = 0b0;
        let byte = 0b00000000;
        while (bitIndex < byteCount) {
            bit = byte << byteIndex;
            const encodedBit = frequencies;
            encoded.push(encodedByte);
        }
        return byte;
    }

    static encodePacketBytes(bytes) {
        const encoded = [];
        const byteCount = bytes.length;
        let byteIndex = 0;
        let bitIndex = 0;
        let byte = 0b00000000;
        let bit = 0b0;
        while (byteIndex < byteCount) {
            byte = bytes[byteIndex];
            const encodedByte = RAXCVR.encodePacketByte(byte);
            encoded.push(...encodedByte);
        }
        return packetBytes;
    }

    static receive() {
        let current = RAXCVR.current;


    }

    static transmit(packet) {

    }

    static #transmitRaw(packet) {
        // Stringify the packet.
        if (typeof(packet) !== "string" && !(packet instanceof Array) && !(packet instanceof Uint8Array)) packet = JSON.stringify(packet);
        // Convert the string packet into a binary packet.
        if (typeof(packet) === "string") packet = RAXCVR.buildPacket(packet);
        // Encode the binary packet.
        const encodedPacket = RAXCVR.encodePacket() && !(packet instanceof Uint8Array)
    }
}
