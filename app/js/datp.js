class DATP {
    static #current;

    static receive() {
        DATP.#current = AXCVR.pitch.current();
    }

    static transmit(packet) {

    }
}
