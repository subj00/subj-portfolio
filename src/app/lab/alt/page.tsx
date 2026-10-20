import { SceneAnchor } from "@/runtime/scene/SceneAnchor";

const anchorBox = "border border-dashed border-current data-[lab-hovered=true]:border-solid";

export default function LabAltPage() {
  return (
    <main className="mt-8">
      <h1 className="text-2xl">WebGL lab B</h1>
      <p className="mt-4">Same scene, different anchor layout.</p>

      <SceneAnchor scene="lab" name="marker" className={`mt-8 h-16 w-1/2 ${anchorBox}`} />

      <div aria-hidden className="h-[60vh]" />

      <SceneAnchor scene="lab" name="target" className={`ml-auto aspect-[4/3] w-48 ${anchorBox}`} />

      <div aria-hidden className="h-[80vh]" />
    </main>
  );
}
