"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function StoreInit() {
  const initStore = useAppStore((state) => state.initStore);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initStore();
    }
  }, [initStore]);

  return null;
}
