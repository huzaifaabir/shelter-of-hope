
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { checkImage, uploadImage } from "../services/mediaService";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ছবিটি খোলা যাচ্ছে না।"));
    image.src = url;
  });
}

async function createCroppedFile(imageSrc, crop, originalFile) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("ছবি প্রসেস করা যাচ্ছে না।");
  }

  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Crop করা ছবি তৈরি করা যায়নি।"));
      },
      "image/jpeg",
      0.92
    );
  });

  const name = (originalFile.name || "image").replace(/\.[^.]+$/, "");

  return new File([blob], `${name}-cropped.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export default function ImageUpload({
  value,
  onChange,
  folder = "donors",
  label = "ছবি আপলোড করুন",
  round = false,
  id,
  aspectRatio,
}) {
  const input = useRef(null);
  const previewUrl = useRef(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [originalFile, setOriginalFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const ratio = aspectRatio || (round ? 1 : 4 / 3);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current);
      }
    };
  }, []);

  function closeEditor() {
    setSource((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });

    setOriginalFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  }

  function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = checkImage(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrl.current = objectUrl;

    setError("");
    setOriginalFile(file);
    setSource(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  }

  async function applyCrop() {
    if (!originalFile || !croppedAreaPixels) {
      setError("আগে ছবির Crop সম্পন্ন করুন।");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const croppedFile = await createCroppedFile(
        source,
        croppedAreaPixels,
        originalFile
      );

      const uploadedUrl = await uploadImage(croppedFile, folder);

      onChange(uploadedUrl);
      closeEditor();
    } catch (err) {
      setError(err?.message || "ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-line bg-slate-50 text-xs text-muted ${
            round ? "rounded-full" : "rounded-lg"
          }`}
        >
          {value ? (
            <img
              src={value}
              alt="নির্বাচিত ছবির প্রিভিউ"
              className="h-full w-full object-cover"
            />
          ) : (
            "ছবি নেই"
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={pick}
          />

          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => input.current?.click()}
            disabled={busy}
          >
            {busy
              ? "আপলোড হচ্ছে..."
              : value
                ? "ছবি পরিবর্তন করুন"
                : label}
          </button>

          {value && !busy && (
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => {
                setError("");
                onChange("");
              }}
            >
              সরিয়ে দিন
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {source && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="ছবি Crop করুন"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                ছবি Crop ও Resize
              </h2>

              <button
                type="button"
                className="rounded px-3 py-1 text-xl text-slate-600 hover:bg-slate-100"
                onClick={closeEditor}
                disabled={busy}
                aria-label="বন্ধ করুন"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <p className="mb-3 text-sm text-slate-600">
                ছবিটি Drag করে সরান এবং Zoom ব্যবহার করে পছন্দমতো অংশ নির্বাচন করুন।
              </p>

              <div className="relative h-[300px] overflow-hidden rounded-lg bg-slate-900 sm:h-[400px]">
                <Cropper
                  image={source}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={ratio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  restrictPosition
                  showGrid
                />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-700">
                    <label htmlFor="image-zoom">Zoom</label>
                    <span>{zoom.toFixed(1)}×</span>
                  </div>

                  <input
                    id="image-zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="w-full accent-pink-600"
                  />
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-700">
                    <label htmlFor="image-rotation">Rotate</label>
                    <span>{rotation}°</span>
                  </div>

                  <input
                    id="image-rotation"
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(event) => setRotation(Number(event.target.value))}
                    className="w-full accent-pink-600"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t bg-slate-50 p-4">
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => {
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                  setError("");
                }}
                disabled={busy}
              >
                Reset
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={closeEditor}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={applyCrop}
                  disabled={busy || !croppedAreaPixels}
                >
                  {busy ? "আপলোড হচ্ছে..." : "Apply Crop"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
