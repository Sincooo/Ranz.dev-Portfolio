"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type PortraitProps = {
  onFeedback: (message: string) => void;
};

export function Portrait({ onFeedback }: PortraitProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = null;
      }
    };
  }, []);

  function previewPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      onFeedback("Choose a PNG, JPEG, or WebP image to preview.");
      return;
    }

    try {
      const nextUrl = URL.createObjectURL(file);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = nextUrl;
      setPhotoUrl(nextUrl);
      onFeedback("Photo preview applied locally; no file was uploaded.");
    } catch {
      onFeedback("This photo could not be previewed. Please choose another image.");
    }
  }

  function handlePreviewError(failedUrl: string) {
    if (objectUrl.current !== failedUrl) return;
    URL.revokeObjectURL(failedUrl);
    objectUrl.current = null;
    setPhotoUrl(null);
    onFeedback("This photo could not be displayed. Please choose another image.");
  }

  return (
    <div className="hero-right">
      <div className="portrait-label portrait-label-top">
        <span>FIG. 01</span>
        <span>THE PERSON BEHIND THE CODE</span>
      </div>
      <div
        className={`portrait-frame${photoUrl ? " has-image" : ""}`}
        id="portraitFrame"
      >
        <div className="portrait-backdrop" aria-hidden="true" />
        <svg
          className="placeholder-portrait"
          viewBox="0 0 480 640"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="silGrad" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#8a8987" offset="0" />
              <stop stopColor="#2c2c2d" offset=".5" />
              <stop stopColor="#141414" offset="1" />
            </linearGradient>
            <radialGradient id="silGlow">
              <stop stopColor="#a5a3a0" stopOpacity=".34" offset="0" />
              <stop stopColor="#a5a3a0" stopOpacity="0" offset="1" />
            </radialGradient>
          </defs>
          <circle cx="235" cy="280" r="225" fill="url(#silGlow)" />
          <path
            d="M53 640c7-138 87-225 179-225 100 0 184 86 196 225Z"
            fill="url(#silGrad)"
          />
          <ellipse cx="242" cy="251" rx="94" ry="125" fill="#575657" />
          <path
            d="M145 231c-13-76 28-138 100-138 85 0 130 64 95 139-20-40-45-56-89-58-43-2-71 18-106 57Z"
            fill="#343434"
          />
          <path
            d="M153 333c15 51 48 70 88 70 44 0 82-39 92-72-20 25-52 43-94 43-37 0-67-12-86-41Z"
            fill="#454445"
          />
        </svg>
        {photoUrl && (
          <Image
            key={photoUrl}
            src={photoUrl}
            id="portraitImage"
            className="portrait-image"
            alt="Portfolio owner's selected portrait"
            fill
            unoptimized
            sizes="(max-width: 480px) 120px, 300px"
            onError={() => handlePreviewError(photoUrl)}
          />
        )}
        <div className="portrait-placeholding" id="portraitPlaceholder">
          <span className="portrait-placeholder-code">{"// PORTRAIT SLOT"}</span>
          <span>Portrait preview</span>
          <input
            type="file"
            id="photoInput"
            accept="image/png,image/jpeg,image/webp"
            tabIndex={photoUrl ? -1 : 0}
            onChange={previewPhoto}
          />
          <label className="photo-label" htmlFor="photoInput">
            PREVIEW YOUR PHOTO <span aria-hidden="true">↗</span>
          </label>
        </div>
        <span className="portrait-corner pc-tl" aria-hidden="true" />
        <span className="portrait-corner pc-tr" aria-hidden="true" />
        <span className="portrait-corner pc-bl" aria-hidden="true" />
        <span className="portrait-corner pc-br" aria-hidden="true" />
      </div>
      <div className="portrait-label portrait-label-bottom">
        <span>IDENTITY / 001</span>
        <span>IMAGE CAN BE ADDED LATER</span>
      </div>
    </div>
  );
}