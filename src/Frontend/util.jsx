import { useState } from "react";

export function SkeletonImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="skeletonImage">loading image...</div>}

      <img
        src={src}
        width="50"
        height="50"
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? "block" : "none" }}
      />
    </>
  );
}
