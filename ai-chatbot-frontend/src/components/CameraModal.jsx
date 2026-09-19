import React, { useRef, useState, useEffect } from 'react';

export const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        'Unable to access camera. Please make sure you have allowed camera permission in your browser.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (!capturedPhoto) return;

    // Extract base64 without prefix
    const base64Data = capturedPhoto.split(',')[1];
    onCapture({
      fileName: `camera_snapshot_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      base64: base64Data,
      previewUrl: capturedPhoto,
      fileSize: Math.round((base64Data.length * 3) / 4),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-backdrop" onClick={onClose}>
      <div className="camera-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="camera-modal-header">
          <div className="camera-title-row">
            <span className="camera-icon">📷</span>
            <h3>Take Live Photo</h3>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="camera-view-container">
          {cameraError ? (
            <div className="camera-error-message">
              <span>⚠️</span>
              <p>{cameraError}</p>
            </div>
          ) : capturedPhoto ? (
            <div className="captured-preview-wrapper">
              <img src={capturedPhoto} alt="Captured preview" className="captured-image" />
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video-feed"
            />
          )}
          {/* Hidden canvas for drawing snapshot */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="camera-modal-footer">
          {cameraError ? (
            <button type="button" className="btn-secondary" onClick={startCamera}>
              Retry Camera
            </button>
          ) : capturedPhoto ? (
            <>
              <button type="button" className="btn-secondary" onClick={handleRetake}>
                🔄 Retake
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirm}>
                ✓ Attach Photo
              </button>
            </>
          ) : (
            <button type="button" className="capture-snap-btn" onClick={handleCapture}>
              <span className="inner-shutter" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
