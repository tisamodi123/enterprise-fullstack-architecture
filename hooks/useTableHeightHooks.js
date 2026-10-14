"use client";

import { useState, useEffect } from "react";

const useTableHeight = (extraOffset = 300) => {
  const [tableHeight, setTableHeight] = useState("500px");

  useEffect(() => {
    let timeoutId;

    const updateTableHeight = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newHeight = window.innerHeight - extraOffset;
        setTableHeight(`${newHeight}px`);
      }, 150); // Debounce time (adjust as needed)
    };

    updateTableHeight(); // Initial calculation
    window.addEventListener("resize", updateTableHeight);

    return () => window.removeEventListener("resize", updateTableHeight);
  }, [extraOffset]);

  return tableHeight;
};

export default useTableHeight;
