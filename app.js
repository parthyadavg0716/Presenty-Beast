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
        const el = document.getElementById(id);
        if (el) {
            el.style.display = (id === pageId) ? 'block' : 'none';
        }
    });
    
    const navs = document.querySelectorAll('nav div');
    navs.forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('onclick') && nav.getAttribute('onclick').includes(pageId)) {
            nav.classList.add('active');
        }
    });
}

function showRegForm() {
    const dash = document.getElementById('regDashboard');
    const form = document.getElementById('regForm');
    if (dash) dash.style.display = 'none';
    if (form) form.style.display = 'block';
}

async function startCapture() {
    showPage('scanPage');
    msg.innerText = "SCANNING FOR REGISTRATION...";
    
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
        window.tempDescriptor = Array.from(detections.descriptor);
        msg.innerText = "FACE CAPTURED SUCCESSFULLY!";
        setTimeout(() => {
            showPage('registerPage');
            const capBtn = document.getElementById('captureBtn');
            const savBtn = document.getElementById('saveBtn');
            if (capBtn) capBtn.style.display = 'none';
            if (savBtn) savBtn.style.display = 'block';
        }, 2000);
    } else {
        msg.innerText = "ERROR: FACE NOT DETECTED";
        setTimeout(() => showPage('registerPage'), 2000);
    }
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

async function identifyFace() {
    if (!db || video.paused || video.ended) return;

    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
        const transaction = db.transaction(["students"], "readonly");
        const store = transaction.objectStore("students");
        const request = store.getAll();

        request.onsuccess = () => {
            const students = request.result;
            let bestMatch = { name: "UNKNOWN", distance: 1.0 };

            students.forEach(student => {
                const distance = faceapi.euclideanDistance(detections.descriptor, student.faceDescriptor);
                if (distance < 0.45 && distance < bestMatch.distance) {
                    bestMatch = { name: student.name, distance: distance };
                }
            });

            if (bestMatch.name !== "UNKNOWN") {
                msg.innerText = `Welcome, ${bestMatch.name}!`;
                msg.style.color = "#00ffa6";
            } else {
                msg.innerText = "UNKNOWN FACE";
                msg.style.color = "orange";
            }
        };
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

async function saveStudent() {
    const name = document.getElementById("studentName").value;
    if (!name || !window.tempDescriptor) return alert("Fill all details and capture face!");

    const roll = await getNextRollNumber();
    const studentData = {
        name: name,
        rollNumber: roll,
        faceDescriptor: window.tempDescriptor,
        parentMobile: document.getElementById("parentMobile").value || "N/A"
    };

    const transaction = db.transaction(["students"], "readwrite");
    const store = transaction.objectStore("students");
    store.add(studentData);

    transaction.oncomplete = () => {
        msg.innerText = "REGISTRATION SUCCESSFUL!";
        setTimeout(() => {
            location.reload(); 
        }, 2000);
    };
}

// Initialize
async function init() {
    await startCamera();
    await loadAI();
    
    setInterval(() => {
        const scanPage = document.getElementById('scanPage');
        if (scanPage && scanPage.style.display === 'block') {
            identifyFace();
        }
    }, 1500);
}

init();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
