import type { Metadata } from "next";
import { ExperienceRoot } from "@/runtime/ExperienceRoot";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Jelena Subotic",
  description: "Frontend developer portfolio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ExperienceRoot>{children}</ExperienceRoot>
      </body>
    </html>
  );
}
