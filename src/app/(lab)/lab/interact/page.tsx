import { NavMenu } from "@/components/navigation/NavMenu";
import { TransitionLink } from "@/components/navigation/TransitionLink";
import { SceneAnchor } from "@/runtime/scene/SceneAnchor";
import { InteractionControls } from "./_demo/InteractionControls";

export default function LabInteractPage() {
  return (
    <main className="mt-8">
      <h1 className="text-2xl">Interaction lab</h1>
      <ul className="mt-4 list-disc pl-5">
        <li>Mouse: hover the shape (it lightens and follows the pointer inside its box).</li>
        <li>Click or tap: select + spin. Drag horizontally: rotate; release returns it.</li>
        <li>Keyboard: the Activate button does the same; Escape deselects.</li>
        <li>Touch: vertical swipes over the shape still scroll the page.</li>
      </ul>

      <div className="mt-6">
        <NavMenu>
          <ul className="grid gap-2 text-2xl">
            <li>
              <TransitionLink href="/lab">Lab A</TransitionLink>
            </li>
            <li>
              <TransitionLink href="/lab/scroll">Scroll lab</TransitionLink>
            </li>
            <li>
              <TransitionLink href="/lab/interact">Interaction lab</TransitionLink>
            </li>
          </ul>
        </NavMenu>
      </div>

      {/* touch-pan-y: horizontal drags reach the 3D object, vertical swipes scroll natively. */}
      <SceneAnchor
        scene="lab"
        name="interact"
        className="mt-6 aspect-square max-w-xs touch-pan-y border border-dashed"
      />

      <InteractionControls />

      <div aria-hidden className="h-[60vh]" />
    </main>
  );
}
