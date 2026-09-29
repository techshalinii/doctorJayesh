"use client";

import { useEffect } from "react";

let depth = 0;
let previousOverflow = "";
let previousPaddingRight = "";

function lock() {
  depth += 1;
  if (depth > 1) return;

  const body = document.body;
  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;

  const gap = window.innerWidth - document.documentElement.clientWidth;
  if (gap > 0) {
    body.style.paddingRight = `${gap}px`;
    document.documentElement.style.setProperty("--scrollbar-gap", `${gap}px`);
  }

  body.style.overflow = "hidden";
}

function unlock() {
  depth = Math.max(0, depth - 1);
  if (depth > 0) return;

  const body = document.body;
  body.style.overflow = previousOverflow;
  body.style.paddingRight = previousPaddingRight;
  document.documentElement.style.removeProperty("--scrollbar-gap");
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
