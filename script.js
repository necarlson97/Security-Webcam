var width;
var height;

var motionBaseImg;
var motionCanvas;
var motionCtx;

var frameCaptureCanvas;
var frameCaptureCtx;

var liveFeed;
var capturedImg;
var capturedVideo;

var downloadButton;
var zip = new JSZip();
var synth = new Tone.Synth().toMaster();

var toDownload = [];

window.onload = function() {
    activateCamera();
}

var motionCheck;
var motionDelay = 500;
var frameDelay = 33;
var recTime = 7000;
function setup() {
    frameCaptureCanvas = document.getElementById("frame capture canvas");
    frameCaptureCanvas.width = width;
    frameCaptureCanvas.height = height;
    frameCaptureCtx = frameCaptureCanvas.getContext('2d');
    frameCaptureCanvas.style.borderColor = 'purple';

    frameCaptureCtx.font = "60px Arial";
    frameCaptureCtx.fillStyle = "darkGray";

    motionBaseImg = document.getElementById("motion base img");
    motionBaseImg.style.borderColor = 'yellow';

    motionCanvas = document.getElementById("motion canvas");
    motionCanvas.width = 2;
    motionCanvas.height = 2;
    motionCtx = motionCanvas.getContext('2d');
    motionCanvas.style.borderColor = 'orange';

    capturedImg = document.getElementById("captured img");
    capturedImg.style.borderColor = 'pink';

    capturedVideo = document.getElementById("captured video");
    capturedVideo.style.borderColor = 'violet';

    downloadButton = document.getElementById("download button");

    setInterval(updateFrames, frameDelay);
    setTimeout(setBase, motionDelay/2);
    motionCheck = setInterval(checkMotion, motionDelay);
}

function updateFrames() {
    frameCaptureCtx.drawImage(liveFeed, 0, 0, width, height);
    frameCaptureCtx.fillText(getTime(), 0, frameCaptureCanvas.height);
}

var time = new Date();
function getTime() {
    return (time.getMonth()+1)+"/"+time.getDate()+"/"+time.getFullYear()+" "+
    time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
}

var encoder;
function startRecord() {
    synth.triggerAttackRelease('E2', .1);
    liveFeed.style.borderColor = 'red';
    frameCaptureCanvas.style.borderColor = 'red';

    encoder = new Whammy.Video(30); 
    for(var t=0; t<recTime; t+=frameDelay) {
        setTimeout(addFrame, t);
    }
}

function addFrame() {
    encoder.add(frameCaptureCanvas);
}

function finishRecord() {
    liveFeed.style.borderColor = 'blue';
    frameCaptureCanvas.style.borderColor = 'purple';
    encoder.compile(false, function(output){
        toDownload.push(output);
        capturedVideo.src = window.webkitURL.createObjectURL(output);
        downloadButton.value = "download: "+toDownload.length;
    });

    motionCheck = setInterval(checkMotion, 1000);
}

var base;
function setBase() {
    motionCtx.drawImage(liveFeed, 0, 0, motionCanvas.width, motionCanvas.height);
    base = getSample();
    motionBaseImg.src = motionCanvas.toDataURL('image/png');
}

function getSample() {
    motionCtx.drawImage(liveFeed, 0, 0, motionCanvas.width, motionCanvas.height);
    var d = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height).data;
    return d;
}

var tolerance = 50;
var resetBaseCounter = 0;
var resetBaseAt = 2;
function checkMotion() {
    var sample = getSample();

    var diff = false;
    for(var i=0; i<sample.length; i++) {
        if(Math.abs(sample[i] - base[i]) > tolerance) diff = true;
    }


    if(diff) {
        startRecord();
        setTimeout(finishRecord, recTime);
        clearInterval(motionCheck);
        resetBaseCounter++;
        if(resetBaseCounter >= resetBaseAt) {
            resetBaseCounter = 0;
            setBase();
        }
    }
}

function downloadZip() {
    for(var i=0; i<toDownload.length; i++) {
        zip.folder("security").file(+i+".webm", toDownload[i]);
    }
    toDownload = [];

    zip.generateAsync({type:"blob"})
        .then(function (blob) {
        saveAs(blob, "security.zip");
    });
    zip = new JSZip();

    downloadButton.value = "download: "+toDownload.length;
}


function activateCamera() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

    if (navigator.getUserMedia) {       
        navigator.getUserMedia({video: true}, handleVideo, videoError);
    }
}
function handleVideo(stream) {
    liveFeed = document.getElementById("live feed");
    liveFeed.srcObject = stream

    liveFeed.addEventListener( "loadedmetadata", function (e) {
        width = liveFeed.videoWidth;
        height = liveFeed.videoHeight;
        setup();
    }, false );
}
function videoError(e) {
    alert("Error",e);
}


