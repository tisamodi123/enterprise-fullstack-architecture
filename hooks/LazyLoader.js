"use client";

import { useRef } from "react";
import { useOnScreen } from "./useOnScreen";

export default function LazyLoader({ children }) {
  const ref = useRef(null); // unique ref per LazyLoader
  const isVisible = useOnScreen(ref, {
    root: null,
    rootMargin: "100px",
    threshold: 0.1,
  });

  return (
    <div ref={ref} style={{ minHeight: "1px" }}>
      {isVisible ? children : null}
    </div>
  );
}
