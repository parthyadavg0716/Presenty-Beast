const video = document.getElementById("video");
const msg = document.getElementById("message");
const MODEL_URL = "models";

// IndexedDB Setup
let db;
const request = indexedDB.open("PresentyBeastDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("students")) {
        db.createObjectStore("students", { keyPath: "rollNumber" });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
};

// Navigation Logic
function showPage(pageId) {
    const pages = ['scanPage', 'registerPage', 'reportsPage'];
    pages.forEach(id => {
        document.getElementById(id).style.display = (id === pageId) ? 'block' : 'none';
    });
    
    const navs = document.querySelectorAll('nav div');
    navs.forEach(nav => nav.classList.remove('active'));
    // Logic to highlight active nav button will be added in HTML
}

// Camera Logic
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
    } catch (e) {
        msg.innerText = "CAMERA ERROR";
    }
}

// AI Loading Logic
async function loadAI() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        msg.innerText = "AI READY";
    } catch (e) {
        msg.innerText = "AI FAILED TO LOAD";
        console.error(e);
    }
}

// Auto-Roll Number Logic
async function getNextRollNumber() {
    return new Promise((resolve) => {
        const transaction = db.transaction(["students"], "readonly");
        const store = transaction.objectStore("students");
        const getAll = store.getAll();

        getAll.onsuccess = () => {
            const students = getAll.result;
            if (students.length === 0) return resolve(1);
            
            const rollNumbers = students.map(s => s.rollNumber).sort((a, b) => a - b);
            for (let i = 0; i < rollNumbers.length; i++) {
                if (rollNumbers[i] !== i + 1) return resolve(i + 1);
            }
            resolve(rollNumbers.length + 1);
        };
    });
}

// Registration Logic
async function registerStudent() {
    const name = document.getElementById("studentName").value;
    if (!name) return alert("Enter Name");

    const roll = await getNextRollNumber();
    
    // Face scanning for registration
    msg.innerText = "SCANNING FACE...";
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
        const studentData = {
            name: name,
            rollNumber: roll,
            faceDescriptor: Array.from(detections.descriptor),
            parentMobile: document.getElementById("parentMobile").value || "N/A"
        };

        const transaction = db.transaction(["students"], "readwrite");
        const store = transaction.objectStore("students");
        store.add(studentData);

        transaction.oncomplete = () => {
            alert(`Registered Successfully! Roll No: ${roll}`);
            showPage('scanPage');
        };
    } else {
        msg.innerText = "FACE NOT DETECTED. TRY AGAIN.";
    }
}

// Initialize
async function init() {
    await startCamera();
    await loadAI();
}

init();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}