"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

import { BottomSheet } from "./BottomSheet";
import { Modal, type DialogProps } from "./Modal";

/** Bottom sheet on phones, centred modal from tablet up. */
export function ResponsiveDialog(props: DialogProps) {
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  return isTabletUp ? <Modal {...props} /> : <BottomSheet {...props} />;
}
