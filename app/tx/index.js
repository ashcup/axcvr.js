// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const AXCVR_PROTOCOL_VERSION = AXCVR.PROTOCOL_VERSION_DEFAULT;

// create web audio api context
let audioCtx;

function playNote(frequency, duration) {
    console.log("Playing note " + frequency + " for " + duration + " ticks")
  // create Oscillator node
  var oscillator = audioCtx.createOscillator();

  oscillator.type = 'square';
  oscillator.frequency.value = frequency; // value in hertz
  oscillator.connect(audioCtx.destination);
  oscillator.start();

  setTimeout(
    function() {
      oscillator.stop();
      playMelody();
    }, duration);
}

function playMelody() {
  if (notes.length > 0) {
    note = notes.pop();
    playNote(note[0], 1000 * 256 / (note[1] * tempo));
  }
}

function start() {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();

    const frequencies = Object.keys(Channel.frequencies(AXCVR_PROTOCOL_VERSION));

    notes = [
        [frequencies[0], 1],
        [frequencies[1], 1],
        // [frequencies[2], 1],
        // [frequencies[3], 2],
        // [frequencies[4], 4],
        // [frequencies[5], 4],
        // [frequencies[6], 1],
        // [frequencies[7], 2],
        // [frequencies[8], 4],
        // [frequencies[9], 4],
        // [frequencies[10], 1],
        // [frequencies[11], 1],
        // [frequencies[12], 1],
        // [frequencies[13], 1],
        // [frequencies[14], 1],
        // [frequencies[15], 2],
        // [frequencies[16], 4],
        // [frequencies[17], 4],
        // [frequencies[18], 1],
        // [frequencies[19], 2],
        // [frequencies[20], 4],
        // [frequencies[21], 4],
        // [frequencies[22], 1]
    ];

    notes.reverse();
    tempo = 100;

    playMelody();
}
