"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function PosterRotator() {
  const posters = [
    { src: "/images/certificate_WM.png", alt: "Learnamyte Certificate Sample" },
    { src: "/images/FOQIC_poster.png", alt: "FOQIC Workshop Poster" },
    { src: "/images/DOP_poster.png", alt: "Data Optimization with Python Poster" },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % posters.length);
    }, 5000); // 5 sec per slide
    return () => clearInterval(id);
  }, [posters.length]);

  return (
    <div
      className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-lg"
      style={{ aspectRatio: "16 / 9" }}
    >
      {posters.map((poster, i) => (
        <Image
          key={poster.src}
          src={poster.src}
          alt={poster.alt}
          fill
          priority={i === 0}
          className={`object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {posters.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === index ? "bg-primary scale-110" : "bg-white/60 hover:bg-white/90"
            }`}
            aria-label={`Show slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
