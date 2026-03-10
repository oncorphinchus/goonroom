"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxSize = 256,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  canvas.width = maxSize;
  canvas.height = maxSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    maxSize,
    maxSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.9,
    );
  });
}

interface AvatarCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCropped: (blob: Blob) => void;
}

export function AvatarCropModal({
  open,
  onOpenChange,
  file,
  onCropped,
}: AvatarCropModalProps): React.ReactNode {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const imageUrl = file ? URL.createObjectURL(file) : null;

  async function handleConfirm(): Promise<void> {
    if (!imageUrl || !croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropped(blob);
      onOpenChange(false);
    } catch {
      // Error handled by caller
    } finally {
      setLoading(false);
    }
  }

  function handleClose(): void {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md border-[#1e1f22] bg-[#2b2d31] p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-white">Crop Avatar</DialogTitle>
        </DialogHeader>
        <div className="relative h-64 w-full">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { backgroundColor: "#1e1f22" } }}
            />
          )}
        </div>
        <div className="px-4 pb-2">
          <label className="mb-1 block text-xs font-medium text-[#8e9297]">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#5865f2]"
          />
        </div>
        <DialogFooter className="border-t border-[#1e1f22] px-4 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose()}
            className="border-[#404249] text-[#dcddde] hover:bg-[#404249]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading}
            className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
          >
            {loading ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
