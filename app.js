const video = document.getElementById("video")
const msg = document.getElementById("message")

async function startCamera(){

try{

const stream = await navigator.mediaDevices.getUserMedia({
video:{ facingMode:"user" }
})

video.srcObject = stream

}catch(e){

msg.innerText = "Camera Error"

}

}

async function loadAI(){

try{

const MODEL_URL = "models"

await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)

msg.innerText = "AI READY"

}catch(e){

msg.innerText = "AI FAILED"

console.log(e)

}

}

startCamera()
loadAI()