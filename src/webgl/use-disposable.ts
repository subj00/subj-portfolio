import { useEffect, useState } from "react";

/**
 * Creates a three.js resource once per component instance and disposes it on
 * unmount. Use for geometries/materials/textures shared between several meshes;
 * resources declared as JSX children (<boxGeometry />) are disposed by R3F already.
 *
 * Under Strict Mode the dev-only unmount/remount disposes and then reuses the
 * same instance; three.js re-uploads disposed resources on next use, so this is safe.
 */
export function useDisposable<T extends { dispose: () => void }>(create: () => T): T {
  const [resource] = useState(create);
  useEffect(() => () => resource.dispose(), [resource]);
  return resource;
}
