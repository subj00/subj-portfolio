import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootDocument } from "@/components/layout/RootDocument";

// TEMPORARY root layout for the architecture lab (/lab/*), kept separate from the
// localized site. Delete the whole (lab) group once real scenes exist.
export const metadata: Metadata = {
  title: "WebGL lab",
  robots: { index: false, follow: false },
};

export default function LabRootLayout({ children }: { children: ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
