import { useState } from "react";

export function SkeletonImage({ src, alt, width, height }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="h-[70px] w-[70px] rounded bg-black/40 animate-pulse"></div>
      )}

      <img
        src={src}
        width={width}
        height={height}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? "block" : "none" }}
        className="self-start"
      />
    </>
  );
}
