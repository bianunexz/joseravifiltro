const API_URL = "https://video-converter-api-production-bb8e.up.railway.app/convert";
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const switchCameraBtn = document.getElementById('switch-camera');
const photoPreview = document.getElementById('photo-preview');
const previewContainer = document.getElementById('preview-container');
const saveBtn = document.getElementById('save-btn');
const retryBtn = document.getElementById('retry-btn');
const startRecordBtn = document.getElementById('start-recording');
const stopRecordBtn = document.getElementById('stop-recording');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingCanvas = document.getElementById('recordingCanvas');
const videoPreviewContainer = document.getElementById('video-preview-container');
const videoPreviewEl = document.getElementById('video-preview');
const saveVideoBtn = document.getElementById('save-video-btn');
const loadingMessage = document.getElementById('loading-message');

let usingFrontCamera = true;
let stream;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

async function startCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  const constraints = { video: { facingMode: usingFrontCamera ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true };
  stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  video.style.transform = usingFrontCamera ? 'scaleX(-1)' : 'scaleX(1)';
}

captureBtn.onclick = () => {
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  canvas.width = settings.width; canvas.height = settings.height;
  const ctx = canvas.getContext('2d');
  if (usingFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  photoPreview.src = canvas.toDataURL('image/png');
  previewContainer.style.display = 'flex';
};

saveBtn.onclick = () => {
  const link = document.createElement('a');
  link.download = 'foto-jose-ravi.png';
  link.href = photoPreview.src;
  link.click();
};

retryBtn.onclick = () => { previewContainer.style.display = 'none'; };

switchCameraBtn.onclick = () => { usingFrontCamera = !usingFrontCamera; startCamera(); };

startCamera();
// Nota: A parte de gravação de vídeo continua igual à do código original, enviando para a API do Railway.
