import { DemoSection } from "./_demo/DemoSection";
import { MotionStatus } from "./_demo/MotionStatus";
import { ScrollSyncDemo } from "./_demo/ScrollSyncDemo";

export default function LabScrollPage() {
  return (
    <main className="mt-8">
      <MotionStatus />

      <DemoSection id="intro" className="min-h-[80vh]">
        <h1 className="text-2xl">Scroll lab</h1>
        <ul className="mt-4 list-disc pl-5">
          <li>Scroll: the box and the 3D cube follow one scrubbed timeline.</li>
          <li>Scroll back up: everything reverses.</li>
          <li>Press Pulse repeatedly: the Director interrupts instead of stacking.</li>
          <li>The status panel shows the active section and the scroll mode.</li>
        </ul>
        <p className="mt-4">
          <a href="#outro" className="underline">
            Jump to the end (native hash link)
          </a>
        </p>
      </DemoSection>

      <ScrollSyncDemo />

      <DemoSection id="outro" className="min-h-[80vh]">
        <h2 className="text-xl">End</h2>
        <p className="mt-4">All information on this page is readable without animation or WebGL.</p>
      </DemoSection>
    </main>
  );
}
