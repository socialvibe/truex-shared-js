import { TXMFocusManager } from "../txm_focus_manager";
import { Focusable } from "../txm_focusable";
import { inputActions } from "../txm_input_actions";

describe("derived 2D focus navigation", () => {
  const fm = new TXMFocusManager();

  function newFocusable({id, x, y, w, h}) {
    const element = {id, top: y, left: x, bottom: y + h, right: x + w, width: w, height: h};
    element.getBoundingClientRect = () => element;
    element.classList = {
      add: () => {},
      remove: () => {}
    };
    return new Focusable(element);
  }

  function testInput(currFocus, action, newFocus) {
    fm.setFocus(currFocus);
    fm.onInputAction(action);
    expect(fm.currentFocus).toBe(newFocus);
  }

  test("test focus grid with overlaps", () => {
    // NOTE: overlaps are ignored, row/col based solely on top/left position.
    const f_0_0 = newFocusable({id: "f_0_0", x: 10, y: 10, w: 40, h: 40});
    const f_0_2 = newFocusable({id: "f_0_2", x: 60, y: 10, w: 40, h: 50});
    const f_1_2 = newFocusable({id: "f_1_2", x: 60, y: 20, w: 40, h: 40}); // overlaps, still in same row
    const f_2_4 = newFocusable({id: "f_2_4", x: 140, y: 70, w: 40, h: 40});  // overlaps, still in same row
    const f_3_0 = newFocusable({id: "f_3_0", x: 10, y: 80, w: 50, h: 40});
    const f_3_1 = newFocusable({id: "f_3_1", x: 20, y: 80, w: 100, h: 40});
    const f_3_3 = newFocusable({id: "f_3_3", x: 80, y: 80, w: 40, h: 40});
    const f_4_5 = newFocusable({id: "f_4_5", x: 200, y: 400, w: 40, h: 40});

    const focusableGrid = fm.derive2DNavigationArray([f_4_5, f_0_0, f_3_1, f_2_4, f_3_3, f_1_2, f_0_2, f_3_0]);
    expect(focusableGrid).toEqual([
      [f_0_0,     undefined, f_0_2],
      [undefined, undefined, f_1_2],
      [undefined, undefined, undefined, undefined, f_2_4],
      [f_3_0,     f_3_1,     undefined, f_3_3],
      [undefined, undefined, undefined, undefined, undefined, f_4_5]
    ]);

    // Moving along the same row or column takes precedence.
    testInput(f_0_0, inputActions.moveDown, f_3_1);
    testInput(f_3_1, inputActions.moveUp, f_0_0);
    testInput(f_0_0, inputActions.moveRight, f_0_2);
    testInput(f_0_2, inputActions.moveDown, f_1_2);
    testInput(f_1_2, inputActions.moveUp, f_0_2);
    testInput(f_1_2, inputActions.moveDown, f_2_4);
    testInput(f_2_4, inputActions.moveUp, f_1_2);
    testInput(f_2_4, inputActions.moveLeft, f_1_2);
    testInput(f_2_4, inputActions.moveRight, f_4_5);
    testInput(f_3_1, inputActions.moveRight, f_3_3);
    testInput(f_3_3, inputActions.moveLeft, f_3_1);
  });
});