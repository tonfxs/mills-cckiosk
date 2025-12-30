"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const images = [
  "/images/click_collect.svg",
  "/images/edisons/edisons-logo Black.svg",
  "/images/mytopia/mytopia-logo-black.svg",
];

export default function Home() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col items-center justify-between min-h-screen w-full bg-white">
      {/* Logo Section */}
      <header className="pt-6 md:pt-10">
        <Image
          src="/images/Mills Brand/Mills Brand_logo (registered)-01.png"
          alt="Mills Brands logo"
          width={650}
          height={300}
          priority
          className="mx-auto h-auto w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px]"
        />
      </header>

      {/* Slideshow */}
      <section className="relative flex items-center justify-center flex-1 w-full overflow-hidden px-4">
        {images.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            width={1000}
            height={900}
            className={`absolute transition-opacity duration-1000 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
              } h-auto w-[100vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]`}
          />
        ))}
      </section>

      <footer
        className="flex items-center justify-center w-full h-[250px] 
                   gap-6 px-4 
                   bg-gradient-to-r from-[#0070C9] to-[#004E9A] 
                   text-white cursor-pointer transition active:opacity-80"
        role="button"
        tabIndex={0}
        aria-label="Touch to start"
        onClick={() => (window.location.href = '/choose-service')}
      >
        <Image
          src="/images/hand.png"
          alt="Touch icon"
          width={80}
          height={100}
          className="object-contain max-h-[100px] mb-10"
        />

        <span className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-wide text-center mb-10">
          TOUCH TO START
        </span>
      </footer>

    </main>
  );
}
