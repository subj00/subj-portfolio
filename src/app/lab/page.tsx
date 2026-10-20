import { SceneAnchor } from "@/runtime/scene/SceneAnchor";

const anchorBox = "border border-dashed border-current data-[lab-hovered=true]:border-solid";

export default function LabPage() {
  return (
    <main className="mt-8">
      <h1 className="text-2xl">WebGL lab A</h1>
      <ul className="mt-4 list-disc pl-5">
        <li>The shape follows the dashed box while scrolling and resizing.</li>
        <li>Hover the shape (the box border turns solid). Click it to detach and re-attach.</li>
        <li>Navigate to Lab B: the same scene re-anchors without remounting the canvas.</li>
      </ul>

      <SceneAnchor
        scene="lab"
        name="target"
        className={`mt-8 aspect-square max-w-sm ${anchorBox}`}
      />

      <div aria-hidden className="h-[120vh]" />

      <SceneAnchor scene="lab" name="marker" className={`h-24 ${anchorBox}`} />

      <div aria-hidden className="h-[50vh]" />
    </main>
  );
}
