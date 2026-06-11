"use client";

import { useEffect } from "react";

/**
 * Suppresses the context menu everywhere (desktop right-click and the
 * Android long-press menu) for a clean kiosk-style activation. The CSS
 * `-webkit-touch-callout: none` handles the iOS long-press sheet; this
 * covers the cases CSS can't.
 *
 * Renders nothing.
 */
export function NoContextMenu() {
  useEffect(() => {
    const onContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  return null;
}
