
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logo } from "./Brand";

function Cta({ to, children, primary }) {
  if (!to || !children) return null;

  const cls = primary
    ? "hero-cta hero-cta-primary"
    : "hero-cta hero-cta-secondary";

  return /^https?:/.test(to) ? (
    <a
      className={cls}
      href={to}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ) : (
    <Link className={cls} to={to}>
      {children}
    </Link>
  );
}

export default function Hero({ hero = {} }) {
  const images = (hero.images || []).filter(Boolean).slice(0, 5);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (
      images.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [images.length]);

  const useVideo =
    hero.mode === "video" &&
    hero.video?.enabled &&
    hero.video?.url;

  const title =
    hero.title || "প্রতিটি মানুষের নিরাপত্তা ও আশার পাশে থাকুন";

  const subtitle =
    hero.subtitle ||
    "মানবিকতা, সহায়তা ও নিরাপত্তার একটি নির্ভরযোগ্য প্ল্যাটফর্ম";

  const paragraph =
    hero.paragraph ||
    "রক্তদাতা খুঁজুন, নিখোঁজ ব্যক্তির তথ্য জানান এবং প্রয়োজনে মানুষের পাশে দাঁড়ান।";

  return (
    <section className="hero-banner">
      {!useVideo &&
        (images.length ? (
          images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className={`hero-background ${
                i === active ? "hero-background-active" : ""
              }`}
            />
          ))
        ) : (
          <div
            className="hero-background hero-fallback"
            style={{ backgroundImage: `url(${logo})` }}
          />
        ))}

      {useVideo && (
        <video
          className="hero-background"
          src={hero.video.url}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      )}

      {/* হালকা কালো overlay */}
      <div
        className="hero-overlay"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.50)",
        }}
      />

      <div className="hero-content container-x">
        <span className="hero-kicker">
          <span className="hero-dot" />
          {subtitle}
        </span>

        <h1
          style={{
            backgroundImage:
              "linear-gradient(90deg, #ff236d 0%, #9b003c 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            display: "inline-block",
          }}
        >
          {title}
        </h1>

        <p className="hero-description">{paragraph}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Cta
            primary
            to={hero.primaryLink || "/missing-children"}
          >
            {hero.primaryText || "⚠ নিখোঁজ রিপোর্ট করুন →"}
          </Cta>

          <Cta to={hero.secondaryLink || "/donors"}>
            {hero.secondaryText || "♡ রক্তদাতা খুঁজুন"}
          </Cta>
        </div>
      </div>

      {images.length > 1 && (
        <div className="hero-dots" aria-label="হিরো ছবির স্লাইডার">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`ছবি ${i + 1} দেখুন`}
              aria-current={i === active}
              className={i === active ? "active" : ""}
            />
          ))}
        </div>
      )}
    </section>
  );
}
