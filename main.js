// Use a single declaration block to avoid "already declared" errors
let model, maxPredictions, webcam;
let isWebcamRunning = false;
let animationId;

const resultDiv = document.getElementById("result");
const uploadInput = document.getElementById("upload");
const uploadedImage = document.getElementById("uploadedImage");
const startBtn = document.getElementById("startWebcam");
const stopBtn = document.getElementById("stopWebcam");
const webcamMessage = document.getElementById("webcamMessage");

// 1. Initialize Model
async function init() {
    try {
        const URL = "./"; 
        model = await tmImage.load(URL + "model.json", URL + "metadata.json");
        maxPredictions = model.getTotalClasses();
        console.log("Model Loaded");
    } catch (e) {
        resultDiv.innerText = "Error loading model. Use a Live Server!";
    }
}
init();

// 2. Image Upload Logic
uploadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage.src = e.target.result;
        uploadedImage.style.display = "inline-block"; // Show the image
    };
    reader.readAsDataURL(file);

    uploadedImage.onload = async () => {
        const predictions = await model.predict(uploadedImage);
        showPrediction(predictions);
    };
});

// 3. Webcam Toggle Logic
startBtn.addEventListener("click", async () => {
    if (!model) return alert("Model not loaded!");
    
    try {
        webcam = new tmImage.Webcam(224, 224, true); 
        await webcam.setup(); 
        await webcam.play();
        
        isWebcamRunning = true;
        
        // Replace placeholder with actual webcam canvas
        const container = document.getElementById("webcam-container");
        container.innerHTML = ""; // Clear placeholder
        container.appendChild(webcam.canvas);

        startBtn.style.display = "none";
        stopBtn.style.display = "inline-block";
        
        animationId = window.requestAnimationFrame(loop);
    } catch (err) {
        webcamMessage.innerText = "Webcam error: " + err;
    }
});

stopBtn.addEventListener("click", () => {
    if (webcam) {
        webcam.stop();
        isWebcamRunning = false;
        window.cancelAnimationFrame(animationId);
        
        // Reset the UI
        const container = document.getElementById("webcam-container");
        container.innerHTML = '<video id="webcam-placeholder" width="224" height="224" style="background: #000;"></video>';
        
        startBtn.style.display = "inline-block";
        stopBtn.style.display = "none";
        resultDiv.innerText = "Webcam Stopped";
    }
});

async function loop() {
    if (!isWebcamRunning) return;
    webcam.update(); 
    const predictions = await model.predict(webcam.canvas);
    showPrediction(predictions);
    animationId = window.requestAnimationFrame(loop);
}

function showPrediction(predictions) {
    // Find highest confidence class
    const highest = predictions.reduce((a, b) =>
        a.probability > b.probability ? a : b
    );

    const label = highest.className.toLowerCase();
    const confidence = (highest.probability * 100).toFixed(1);

    let finalText = "";
    let finalColor = "";

    // Decide final result based on class name
    if (label.includes("wear")) {
        finalText = "WEAR MASK";
        finalColor = "green";
    } 
    else if (label.includes("no")) {
        finalText = "NO MASK";
        finalColor = "red";
    } 
    else {
        finalText = "Incorrect MASK";
        finalColor = "#f59e0b"; // orange
    }

    // Build UI
    let html = `
        <div style="font-size:32px; font-weight:bold; color:${finalColor};">
            FINAL RESULT: ${finalText}
        </div>
        <div style="font-size:18px; margin-top:5px;">
            Confidence: ${confidence}%
        </div>
        <hr style="margin:12px 0;">
    `;

    // Show all class confidences
    predictions.forEach(pred => {
        html += `
            <div style="font-size:16px;">
                ${pred.className}: ${(pred.probability * 100).toFixed(1)}%
            </div>
        `;
    });

    resultDiv.innerHTML = html;
}


