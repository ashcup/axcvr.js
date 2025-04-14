// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const AXCVR_PROTOCOL_VERSION = AXCVR.PROTOCOL_VERSION_DEFAULT;

// create web audio api context
let audioCtx;

AXCVR._playNote = function _playNote(frequency, duration, tempo, remainingNotes) {
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
      AXCVR.playMelody(remainingNotes, tempo);
    }, duration);
}

AXCVR.playNote = function playNote(note, frequency, duration, tempo) {
    AXCVR._playNote(frequency, duration, tempo, [ note ]);
}

AXCVR._playMelody = function _playMelody(remainingNotes, tempo) {
  if (remainingNotes.length > 0) {
    const note = remainingNotes.pop();
    AXCVR._playNote(note[0], 5, tempo, remainingNotes);
  }
}

AXCVR.playMelody = function playMelody(remainingNotes, tempo) {
  const melody = JSON.parse(JSON.stringify(remainingNotes));
  return AXCVR._playMelody(melody, tempo);
}

function start() {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();

    const frequencies = Object.keys(Channel.frequencies(AXCVR_PROTOCOL_VERSION));

    console.log(frequencies);

    const notes = [
        [frequencies[0],  1],
        [frequencies[1],  1],
        [frequencies[2],  1],
        [frequencies[3],  1],
        [frequencies[4],  1],
        [frequencies[5],  1],
        [frequencies[6],  1],
        [frequencies[7],  1],
        [frequencies[8],  1],
        [frequencies[9],  1],
        [frequencies[10], 1],
        [frequencies[11], 1],
        [frequencies[12], 1],
        [frequencies[13], 1],
        [frequencies[14], 1],
        [frequencies[15], 1],
        // [frequencies[16], 4],
        // [frequencies[17], 4],
        // [frequencies[18], 1],
        // [frequencies[19], 2],
        // [frequencies[20], 4],
        // [frequencies[21], 4],
        // [frequencies[22], 1]
    ];

    const tempo = 100;

    AXCVR.playMelody(notes, tempo);
}
