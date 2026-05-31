import { useState } from "react";

export function SkeletonImage({ src, alt, width, height }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="skeletonImage">loading image...</div>}

      <img
        src={src}
        width={width}
        height={height}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? "block" : "none" }}
      />
    </>
  );
}
