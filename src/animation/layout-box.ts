/** A layout box in document space. */
export interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Document-space layout box from offsets: ignores CSS transforms (including
 * those the scroll transitions set), so geometry measured from it stays put
 * while their timelines run.
 */
export function layoutBox(element: HTMLElement): LayoutBox {
  let x = 0;
  let y = 0;
  for (let e: HTMLElement | null = element; e; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y, w: element.offsetWidth, h: element.offsetHeight };
}
