# React Custom Hooks: LazyLoader, Viewport Observers (IntersectionObserver) & Dynamic Layouts

A production-tested collection of React custom hooks and utility components designed for viewport observation, lazy component mounting, and responsive grid table heights.

---

## 🪝 Hooks Overview

| Hook / Component | Description |
| :--- | :--- |
| **`useOnScreen.js`** | Utilizes the browser's `IntersectionObserver` API to detect when an element enters the viewport with customizable thresholds and root margins. |
| **`LazyLoader.js`** | A zero-dependency viewport wrapper that delays rendering heavy child components until they are near or inside the user's viewport. |
| **`useCategoryData.js`** | Manages categorized data fetching, loading states, and memoization for e-commerce category browsers. |
| **`useTableHeightHooks.js`** | Dynamically computes and adjusts table/viewport heights to support responsive, scroll-locked grid layouts. |
