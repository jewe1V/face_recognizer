const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const resultDiv = document.getElementById("result");
const loader = document.getElementById("loader");
const infoText = document.getElementById("infoText");
const fileInputLabel = document.getElementById("fileInputLabel");
const errorMessage = document.getElementById("errorMessage");
const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");
const emotionIcon = document.getElementById("emotionIcon");
const emotionText = document.getElementById("emotionText");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");

const emotionMap = {
angry: { label: "Злость", emoji: "😠", color: "#f72585" },
disgust: { label: "Отвращение", emoji: "🤢", color: "#7209b7" },
fear: { label: "Страх", emoji: "😨", color: "#560bad" },
happy: { label: "Счастье", emoji: "😊", color: "#4cc9f0" },
neutral: { label: "Нейтрально", emoji: "😐", color: "#4895ef" },
sad: { label: "Грусть", emoji: "😢", color: "#4361ee" },
surprise: { label: "Удивление", emoji: "😲", color: "#3f37c9" }
};

let isAnalyzed = false;
let currentObjectURL = null;

imageInput.addEventListener("change", (event) => {
const file = event.target.files[0];
errorMessage.style.display = "none";


if (!file) {
resetAnalysis();
return;
}

const validTypes = ["image/jpeg", "image/png", "image/gif"];
if (!validTypes.includes(file.type)) {
console.log("Invalid file type:", file.type);
showError("Пожалуйста, выберите изображение в формате JPG, PNG или GIF");
resetAnalysis();
return;
}

if (file.size > 5 * 1024 * 1024) {
console.log("File too large:", file.size);
showError("Размер файла не должен превышать 5MB");
resetAnalysis();
return;
}

if (currentObjectURL) {
URL.revokeObjectURL(currentObjectURL);
console.log("Previous ObjectURL revoked");
}

try {
currentObjectURL = URL.createObjectURL(file);
console.log("ObjectURL created:", currentObjectURL);
preview.src = currentObjectURL;
document.querySelector('.preview-wrapper').style.display = 'block';
} catch (error) {
console.error("Error creating ObjectURL:", error);
showError("Ошибка при загрузке изображения");
resetAnalysis();
return;
}

fileInputLabel.innerHTML = `
<i class="fas fa-check-circle"></i><br>
<span style="display: inline-block; max-width: 100%;">
Файл: <strong style="word-break: break-all;">${file.name}</strong>
</span><br>
<small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
`;
fileInputLabel.style.whiteSpace = 'normal';
fileInputLabel.style.wordWrap = 'break-word'

analyzeBtn.style.display = "inline-flex";
analyzeBtn.disabled = false;

infoText.style.display = "none";
hideResult();
isAnalyzed = false;
resetBtn.style.display = "none"; 
});

analyzeBtn.addEventListener("click", async () => {
if (!imageInput.files[0]) {
console.log("No file to analyze");
return;
}

const file = imageInput.files[0];
console.log("Starting analysis for file:", file.name);

loader.style.display = "block";
analyzeBtn.disabled = true;
analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';

try {
const formData = new FormData();
formData .append("file", file);

const response = await fetch("/predict", {
method: "POST",
body: formData
});

const data = await response.json();

if (response.ok && data.emotion in emotionMap) {
const emotionData = emotionMap[data.emotion];
const confidencePercent = Math.round(data.confidence * 100);

confidenceBar.style.backgroundColor = emotionData.color;

setTimeout(() => {
confidenceBar.style.width = `${confidencePercent}%`;
}, 100);

emotionIcon.textContent = emotionData.emoji;
emotionText.textContent = `Эмоция: ${emotionData.label}`;
confidenceText.textContent = `Уверенность: ${confidencePercent}%`;

showResult();

analyzeBtn.style.display = "none";
resetBtn.style.display = "inline-flex";
isAnalyzed = true;

} else {
console.log("Error in response:", data.error);
showError(data.error || "Не удалось распознать эмоцию");
}
} catch (error) {
console.error("Error during analysis:", error);
showError(error.message || "Произошла ошибка при обработке изображения");
} finally {
loader.style.display = "none";
analyzeBtn.disabled = false;
analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Анализировать';
}
});

resetBtn.addEventListener("click", resetAnalysis);

function resetAnalysis() {
console.log("Resetting analysis");
imageInput.value = "";
preview.src = "";
document.querySelector('.preview-wrapper').style.display = 'none';
fileInputLabel.innerHTML = `
<i class="fas fa-cloud-upload-alt"></i>
<span>Перетащите фото сюда или <strong>нажмите для выбора</strong></span>
`;
fileInputLabel.style.display = "flex";
analyzeBtn.style.display = "none";
resetBtn.style.display = "none";
infoText.style.display = "block";
hideResult();
errorMessage.style.display = "none";
isAnalyzed = false;
if (currentObjectURL) {
URL.revokeObjectURL(currentObjectURL);
currentObjectURL = null;
console.log("ObjectURL revoked during reset");
}
}

function showError(message) {
errorMessage.textContent = message;
errorMessage.style.display = "block";
}

function showResult() {
resultDiv.classList.add("show");
fileInputLabel.style.display = "none";
}

function hideResult() {
resultDiv.classList.remove("show");
emotionIcon.textContent = "";
emotionText.textContent = "";
confidenceBar.style.width = "0";
confidenceText.textContent = "";
}

fileInputLabel.addEventListener("dragover", (e) => {
e.preventDefault();
fileInputLabel.style.borderColor = "#4361ee";
fileInputLabel.style.backgroundColor = "rgba(67, 97, 238, 0.1)";
});

fileInputLabel.addEventListener("dragleave", () => {
fileInputLabel.style.borderColor = "#d1d5db";
fileInputLabel.style.backgroundColor = "#f9fafb";
});

fileInputLabel.addEventListener("drop", (e) => {
e.preventDefault();
fileInputLabel.style.borderColor = "#d1d5db";
fileInputLabel.style.backgroundColor = "#f9fafb";

if (e.dataTransfer.files.length) {
imageInput.files = e.dataTransfer.files;
const event = new Event("change");
imageInput.dispatchEvent(event);
}});