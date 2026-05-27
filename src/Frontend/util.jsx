import { useState } from "react";

export function SkeletonImage({ src }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="skeletonImage">loading image...</div>}

      <img
        src={src}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? "block" : "none" }}
      />
    </>
  );
}
