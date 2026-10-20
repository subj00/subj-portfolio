import Image from "next/image";
import { site } from "@/content/site";
// Static import: dimensions (2172×724) are read at build time, so the image keeps
// its proportions and reserves its space (no layout shift). If the file is ever
// removed, the build fails instead of shipping a broken graphic.
import nameDisplay from "../../../public/images/branding/name-display.png";
import styles from "./DisplayName.module.css";

interface DisplayNameProps {
  /** Preload for LCP when the graphic is above the fold. */
  preload?: boolean;
  /** Rendered width hints for responsive srcset selection. */
  sizes: string;
}

/**
 * The name in the custom display typeface. Its alt text is the accessible name,
 * so placing it inside a heading gives that heading the real text exactly once.
 * Size the parent to the width the LETTERS should occupy; the transparent
 * padding is trimmed optically (see DisplayName.module.css).
 */
export function DisplayName({ preload = false, sizes }: DisplayNameProps) {
  return (
    <Image
      src={nameDisplay}
      alt={site.name}
      preload={preload}
      sizes={sizes}
      className={styles.trimmed}
    />
  );
}
