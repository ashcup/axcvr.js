// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const AXCVR_PROTOCOL_VERSION = AXCVR.PROTOCOL_VERSION_DEFAULT;

const CANVAS_SIZE = 100;
const WIDTH = CANVAS_SIZE;
const HEIGHT = CANVAS_SIZE;

const AUDIO_RESOLUTION = 32;

let audioInputStream = null;

let audioCtx = null;
let analyser = null;

let frequencyData = null;
let source = null;
let bufferLength = null;

let canvas = document.getElementById("canvasCtx");
let canvasCtx = canvas.getContext("2d");

function draw() {
    drawVisual = requestAnimationFrame(draw);

    canvasCtx.fillStyle = "rgb(0 0 0)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = frequencyData[i] / 2;

        let temperature = barHeight * 1.5 + 50;
        let red = Math.min(255, temperature);
        let blue = Math.max(0, 255 - temperature);
        canvasCtx.fillStyle = `rgb(${red} 50 ${blue})`;
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
    }
}

function save() {
    // Create a new audio snapshot.
    const json = {};
    json.frequency = AXCVR.pitch.current();
    const jsonString = JSON.stringify(json);
    AXCVR.download("axcvr-state.json");
}

async function getInputStream(constraints) {
    let stream = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
    } catch (err) {
        return null;
    }
}

function logAudioInput() {
    console.log(AXCVR.pitch.current());
    // console.log(frequencyData[bufferLength - 16]);
    // for (let i = 0; i < frequencyData.length; i++) {
    //     console.log("    " + frequencyData[i]);
    // }
}

function tickAudioInput() {
    analyser.getByteFrequencyData(frequencyData);

    logAudioInput();
}

async function tick() {
    tickAudioInput();
}

async function start() {
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();

    audioInputStream = await getInputStream({ audio: true });

    source = audioCtx.createMediaStreamSource(audioInputStream);
    source.connect(analyser);
    // analyser.connect(distortion);
    // distortion.connect(audioCtx.destination);

    analyser.fftSize = AUDIO_RESOLUTION;
    bufferLength = analyser.frequencyBinCount;
    frequencyData = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    // analyser.fftSize = 2048;

    // bufferLength = analyser.frequencyBinCount;
    // frequencyData = new Uint8Array(bufferLength);

    AXCVR.pitch.initialize(audioCtx);

    setInterval(() => { tick(); draw(); }, AXCVR.TRANSFER_RATE);

    AXCVR.pitch.startDetection(audioCtx, AXCVR_PROTOCOL_VERSION);
}
