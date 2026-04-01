import { useEffect, useMemo, useState } from "react";
import "./imageCropModal.css";

const IMAGE_QUALITY = 0.85;
const PREVIEW_WIDTH = 520;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to process image."));
    image.src = src;
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const buildCropMetrics = ({
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
  zoom,
  offsetX,
  offsetY,
}) => {
  const baseScale = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const displayScale = baseScale * zoom;
  const displayedWidth = imageWidth * displayScale;
  const displayedHeight = imageHeight * displayScale;
  const maxTranslateX = Math.max((displayedWidth - frameWidth) / 2, 0);
  const maxTranslateY = Math.max((displayedHeight - frameHeight) / 2, 0);
  const translateX = offsetX * maxTranslateX;
  const translateY = offsetY * maxTranslateY;

  const sourceWidth = frameWidth / displayScale;
  const sourceHeight = frameHeight / displayScale;
  const sourceX = clamp(
    (imageWidth - sourceWidth) / 2 - translateX / displayScale,
    0,
    imageWidth - sourceWidth
  );
  const sourceY = clamp(
    (imageHeight - sourceHeight) / 2 - translateY / displayScale,
    0,
    imageHeight - sourceHeight
  );

  return {
    displayedWidth,
    displayedHeight,
    translateX,
    translateY,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
  };
};

const getCroppedImageDataUrl = async ({
  src,
  aspectRatio,
  zoom,
  offsetX,
  offsetY,
  outputWidth,
  outputHeight,
}) => {
  const image = await loadImage(src);
  const frameWidth = PREVIEW_WIDTH;
  const frameHeight = Math.round(frameWidth / aspectRatio);
  const metrics = buildCropMetrics({
    imageWidth: image.width,
    imageHeight: image.height,
    frameWidth,
    frameHeight,
    zoom,
    offsetX,
    offsetY,
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to process image.");
  }

  context.drawImage(
    image,
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
};

const ImageCropModal = ({
  file,
  aspectRatio = 1,
  title,
  outputWidth,
  outputHeight,
  confirmLabel = "Save",
  onCancel,
  onConfirm,
}) => {
  const [imageSrc, setImageSrc] = useState("");
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!file) return undefined;

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);

    loadImage(objectUrl)
      .then((image) => {
        setImageSize({ width: image.width, height: image.height });
      })
      .catch(() => {
        setImageSize({ width: 0, height: 0 });
      });

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const frameWidth = PREVIEW_WIDTH;
  const frameHeight = useMemo(
    () => Math.round(frameWidth / aspectRatio),
    [aspectRatio]
  );

  const metrics = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return null;

    return buildCropMetrics({
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      frameWidth,
      frameHeight,
      zoom,
      offsetX,
      offsetY,
    });
  }, [frameHeight, frameWidth, imageSize.height, imageSize.width, offsetX, offsetY, zoom]);

  const handleConfirm = async () => {
    if (!imageSrc) return;

    try {
      setIsSaving(true);
      const croppedImage = await getCroppedImageDataUrl({
        src: imageSrc,
        aspectRatio,
        zoom,
        offsetX,
        offsetY,
        outputWidth,
        outputHeight,
      });
      onConfirm(croppedImage);
    } catch {
      onCancel();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="crop-modal-backdrop" onClick={() => onCancel()}>
      <div className="crop-modal" onClick={(event) => event.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>{title}</h3>
          <button type="button" className="crop-close-btn" onClick={() => onCancel()}>
            Close
          </button>
        </div>

        <div className="crop-preview-shell">
          <div
            className="crop-preview-frame"
            style={{ width: `${frameWidth}px`, height: `${frameHeight}px` }}
          >
            {imageSrc && metrics ? (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="crop-preview-image"
                style={{
                  width: `${metrics.displayedWidth}px`,
                  height: `${metrics.displayedHeight}px`,
                  transform: `translate(calc(-50% + ${metrics.translateX}px), calc(-50% + ${metrics.translateY}px))`,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="crop-controls">
          <label>
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <label>
            Left / Right
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={offsetX}
              onChange={(event) => setOffsetX(Number(event.target.value))}
            />
          </label>
          <label>
            Up / Down
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={offsetY}
              onChange={(event) => setOffsetY(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="crop-modal-actions">
          <button type="button" className="crop-secondary-btn" onClick={() => onCancel()}>
            Cancel
          </button>
          <button
            type="button"
            className="crop-primary-btn"
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
