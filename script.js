// Filtro José Ravi - 1 Aninho 🎉
const API_URL = "https://api-video-filtro-production.up.railway.app/convert";

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const switchCameraBtn = document.getElementById('switch-camera');
const photoPreview = document.getElementById('photo-preview');
const previewContainer = document.getElementById('preview-container');
const saveBtn = document.getElementById('save-btn');
const retryBtn = document.getElementById('retry-btn');
const instructions = document.getElementById('instructions');

const startRecordBtn = document.getElementById('start-recording');
const stopRecordBtn = document.getElementById('stop-recording');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingCanvas = document.getElementById('recordingCanvas');

const videoPreviewContainer = document.getElementById('video-preview-container');
const videoPreviewEl = document.getElementById('video-preview');
const saveVideoBtn = document.getElementById('save-video-btn');
const videoInstructions = document.getElementById('video-instructions');

const loadingMessage = document.getElementById('loading-message');

let usingFrontCamera = true;
let stream;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordStartTime = 0;
let recordTimerInterval = null;
let frameInterval = null;
let recordedMimeType = 'video/webm';
let lastVideoUrl = null;

const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

function showLoading() { loadingMessage.style.display = 'block'; }
function hideLoading() { loadingMessage.style.display = 'none'; }

function setButtonsDisabledDuringProcess(disabled) {
  switchCameraBtn.disabled = disabled;
  captureBtn.disabled = disabled;
  startRecordBtn.disabled = disabled;
  stopRecordBtn.disabled = disabled;
}

async function startCamera() {
  if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  if (stream) stream.getTracks().forEach(track => track.stop());
  const constraints = {
    video: { facingMode: usingFrontCamera ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true
  };
  stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  video.style.transform = usingFrontCamera ? 'scaleX(-1)' : 'scaleX(1)';
  overlay.style.transform = 'scaleX(1)';
}

switchCameraBtn.onclick = () => { usingFrontCamera = !usingFrontCamera; startCamera(); };

// FOTO
captureBtn.onclick = () => {
  if (!stream) return;
  const track = stream.getVideoTracks()[0];
  const { width, height } = track.getSettings();
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (usingFrontCamera) { ctx.translate(width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0, width, height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(overlay, 0, 0, width, height);
  photoPreview.src = canvas.toDataURL('image/png');
  previewContainer.style.display = 'flex';
};

saveBtn.onclick = () => {
  const link = document.createElement('a');
  link.download = 'foto-joseravi.png';
  link.href = photoPreview.src;
  link.click();
  if (isiOS) instructions.style.display = 'block';
};

retryBtn.onclick = () => { previewContainer.style.display = 'none'; instructions.style.display = 'none'; };

// TIMER
function startRecordingTimer() {
  recordStartTime = Date.now();
  recordingIndicator.style.display = 'block';
  recordingIndicator.textContent = '🔴 REC 00:00';
  recordTimerInterval = setInterval(() => {
    const total = Math.floor((Date.now() - recordStartTime) / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    recordingIndicator.textContent = `🔴 REC ${m}:${s}`;
  }, 500);
}

function stopRecordingTimer() {
  if (recordTimerInterval) { clearInterval(recordTimerInterval); recordTimerInterval = null; }
  recordingIndicator.style.display = 'none';
}

// VÍDEO
function startVideoRecording() {
  if (!stream) return;

  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  const camWidth = settings.width || 1280;
  const camHeight = settings.height || 720;
  const targetWidth = 360;
  const targetHeight = Math.round(camHeight * (targetWidth / camWidth));

  recordingCanvas.width = targetWidth;
  recordingCanvas.height = targetHeight;
  const rctx = recordingCanvas.getContext('2d');

  isRecording = true;
  recordedChunks = [];
  videoPreviewContainer.style.display = 'none';
  videoInstructions.style.display = 'none';

  frameInterval = setInterval(() => {
    if (!isRecording) { clearInterval(frameInterval); return; }
    rctx.clearRect(0, 0, targetWidth, targetHeight);
    if (usingFrontCamera) {
      rctx.save(); rctx.translate(targetWidth, 0); rctx.scale(-1, 1);
      rctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      rctx.restore();
    } else {
      rctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    }
    rctx.drawImage(overlay, 0, 0, targetWidth, targetHeight);
  }, 1000 / 15);

  const videoStream = recordingCanvas.captureStream(15);
  const combinedStream = new MediaStream();
  videoStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length > 0) combinedStream.addTrack(audioTracks[0]);

  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  let mimeType = '';
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
  }
  recordedMimeType = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';

  try {
    mediaRecorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : {});
  } catch (e) {
    alert('Este navegador não suporta gravação de vídeo. As fotos funcionam normalmente. 🥹');
    isRecording = false;
    startRecordBtn.style.display = 'inline-block';
    stopRecordBtn.style.display = 'none';
    return;
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    isRecording = false;
    if (frameInterval) { clearInterval(frameInterval); frameInterval = null; }
    stopRecordingTimer();

    const blob = new Blob(recordedChunks, { type: recordedMimeType });
    if (!blob || blob.size === 0) {
      alert('Nenhum dado de vídeo foi gravado.');
      startRecordBtn.style.display = 'inline-block';
      stopRecordBtn.style.display = 'none';
      return;
    }

    showLoading();
    setButtonsDisabledDuringProcess(true);

    try {
      const formData = new FormData();
      formData.append('video', blob, 'video.webm');
      const device = isiOS ? 'ios' : 'android';

      const resposta = await fetch(`${API_URL}?device=${device}`, { method: 'POST', body: formData });

      if (!resposta.ok) {
        alert('Ocorreu um erro ao converter o vídeo. Tente novamente.');
      } else {
        const mp4Blob = await resposta.blob();
        const url = URL.createObjectURL(mp4Blob);
        lastVideoUrl = url;

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'video-joseravi.mp4';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 1000);

        if (isiOS) {
          videoPreviewContainer.style.display = 'flex';
          videoPreviewEl.style.display = 'none';
          saveVideoBtn.style.display = 'none';
          videoInstructions.style.display = 'block';
        } else {
          videoPreviewContainer.style.display = 'none';
        }
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao enviar o vídeo para o servidor.');
    } finally {
      hideLoading();
      setButtonsDisabledDuringProcess(false);
      startRecordBtn.style.display = 'inline-block';
      stopRecordBtn.style.display = 'none';
    }
  };

  startRecordingTimer();
  mediaRecorder.start(100);
  startRecordBtn.style.display = 'none';
  stopRecordBtn.style.display = 'inline-block';
}

startRecordBtn.onclick = () => { if (!isRecording) startVideoRecording(); };
stopRecordBtn.onclick = () => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); };

saveVideoBtn.onclick = () => {
  if (!lastVideoUrl) return;
  const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.style.display = 'none'; a.href = lastVideoUrl; a.download = 'video-joseravi.' + ext;
  document.body.appendChild(a); a.click();
  setTimeout(() => document.body.removeChild(a), 1000);
  if (isiOS) videoInstructions.style.display = 'block';
};

startCamera();
