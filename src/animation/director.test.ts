import { afterEach, describe, expect, it } from "vitest";
import { isPlaying, play, stop, stopScope } from "./director";
import { gsap } from "./gsap";

const target = { x: 0 };

afterEach(() => {
  stopScope("page", "kill");
  stopScope("app", "kill");
  target.x = 0;
});

describe("director", () => {
  it("runs one timeline per channel and interrupts the previous one", () => {
    play("ch", (tl) => {
      tl.to(target, { x: 100, duration: 1 });
    });
    const second = play("ch", (tl) => {
      tl.to(target, { x: 50, duration: 1 });
    });
    expect(gsap.getTweensOf(target)).toHaveLength(1); // the first sequence was killed
    expect(isPlaying("ch")).toBe(true);
    second.progress(1);
    expect(isPlaying("ch")).toBe(false);
    expect(target.x).toBe(50);
  });

  it("supports complete and revert interruptions", () => {
    play("ch", (tl) => {
      tl.to(target, { x: 100, duration: 1 });
    });
    stop("ch", "complete");
    expect(target.x).toBe(100);

    target.x = 0;
    const tl = play("ch", (t) => {
      t.to(target, { x: 100, duration: 1 });
    });
    tl.progress(0.5);
    stop("ch", "revert");
    expect(target.x).toBe(0);
  });

  it("stops only the requested scope", () => {
    play(
      "page-seq",
      (tl) => {
        tl.to(target, { x: 1, duration: 1 });
      },
      { scope: "page" },
    );
    play(
      "app-seq",
      (tl) => {
        tl.to({ y: 0 }, { y: 1, duration: 1 });
      },
      { scope: "app" },
    );
    stopScope("page");
    expect(isPlaying("page-seq")).toBe(false);
    expect(isPlaying("app-seq")).toBe(true);
  });
});
