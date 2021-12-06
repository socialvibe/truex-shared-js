import { TXMFocusManager } from "../txm_focus_manager";
import { Focusable } from "../txm_focusable";
import { inputActions } from "../txm_input_actions";

describe("focus navigation", () => {

  const focusManager = new TXMFocusManager();

  const up = inputActions.moveUp;
  const down = inputActions.moveDown;
  const left = inputActions.moveLeft;
  const right = inputActions.moveRight;

  function newFocusable({id, x, y, w, h}) {
    const element = {id, top: y, left: x, bottom: y + h, right: x + w, width: w, height: h};
    element.classList = {
      add: () => {},
      remove: () => {}
    };

    element.getBoundingClientRect = () => element;

    element.setX = function(x) {
      this.x = x;
      this.right = x + this.width;
    };

    element.setY = function(y) {
      this.y = y;
      this.bottom = y + this.height;
    };

    return new Focusable(element);
  }

  function testInput(currFocus, action, newFocus) {
    focusManager.setFocus(currFocus);
    focusManager.onInputAction(action);
    expect(focusManager.currentFocus).toBe(newFocus);
  }

  test("test focus grid with overlaps, gaps", () => {
    // NOTE: overlaps are ignored, row/col based solely on top/left position.
    const f_0_0 = newFocusable({id: "f_0_0", x: 10, y: 10, w: 40, h: 30});
    const f_0_2 = newFocusable({id: "f_0_2", x: 60, y: 10, w: 40, h: 30});
    const f_1_2 = newFocusable({id: "f_1_2", x: 55, y: 40, w: 55, h: 40}); // overlaps
    const f_2_4 = newFocusable({id: "f_2_4", x: 110, y: 70, w: 40, h: 40});  // overlaps
    const f_3_0 = newFocusable({id: "f_3_0", x: 10, y: 80, w: 50, h: 40});
    const f_3_1 = newFocusable({id: "f_3_1", x: 20, y: 80, w: 50, h: 40});
    const f_3_3 = newFocusable({id: "f_3_3", x: 80, y: 80, w: 40, h: 40});
    const f_4_5 = newFocusable({id: "f_4_5", x: 200, y: 400, w: 40, h: 40});

    // Note: all focus navigation is done according to the implicit sort into rows by increasing y, each row into columns by increasing x,
    focusManager.setContentFocusables([f_4_5, f_0_0, f_3_1, f_2_4, f_3_3, f_1_2, f_0_2, f_3_0]);

    // Moving along the same row or column takes precedence.
    testInput(f_0_0, down, f_3_0);
    testInput(f_3_0, up, f_1_2);
    testInput(f_0_0, right, f_0_2);
    testInput(f_0_2, down, f_1_2);
    testInput(f_1_2, up, f_0_2);
    testInput(f_1_2, down, f_3_0);
    testInput(f_2_4, left, f_1_2);
    testInput(f_2_4, up, f_0_2);
    testInput(f_2_4, right, f_4_5);
    testInput(f_3_1, right, f_3_3);
    testInput(f_3_3, left, f_3_1);
  });

  test("test simple focus grid", () => {
    const A = newFocusable({id: "A", x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 30, y: 10, w: 10, h: 10});
    const C = newFocusable({id: "C", x: 50, y: 10, w: 10, h: 10});
    const D = newFocusable({id: "D", x: 10, y: 30, w: 10, h: 10});
    const E = newFocusable({id: "E", x: 30, y: 30, w: 10, h: 10});
    const F = newFocusable({id: "F", x: 50, y: 30, w: 10, h: 10});

    focusManager.setContentFocusables([
      A, B, C,
      D, E, F,
    ]);

    testInput(A, down, D);
    testInput(D, up, A);
    testInput(A, right, B);
    testInput(B, right, C);
    testInput(C, right, C);
    testInput(C, down, F);
    testInput(F, left, E);
    testInput(E, up, B);
    testInput(B, down, E);
    testInput(E, left, D);
  });

  test("test A kitty corner B", () => {
    const A = newFocusable({id: "A", x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 30, y: 30, w: 10, h: 10});

    focusManager.setContentFocusables([
      A,
           B
    ]);

    testInput(A, down, B);
    testInput(A, right, B);
    testInput(B, up, A);
    testInput(B, left, A);
    testInput(B, right, B);
    testInput(A, up, A);
  });

  test("test stepping down", () => {
    const A = newFocusable({id: "A", x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 30, y: 30, w: 10, h: 10});
    const C = newFocusable({id: "C", x: 90, y: 90, w: 10, h: 10});

    focusManager.setContentFocusables([
      A,
         B,
             C
    ]);

    testInput(A, down, B);
    testInput(A, right, B);
    testInput(B, down, C);
    testInput(B, right, C);
    testInput(C, down, C);
    testInput(C, right, C);
    testInput(C, up, B);
    testInput(C, left, B);
    testInput(B, up, A);
    testInput(B, left, A);
  });

  test("test stepping up", () => {
    const A = newFocusable({id: "A", x: 10, y: 90, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 30, y: 30, w: 10, h: 10});
    const C = newFocusable({id: "C", x: 90, y: 10, w: 10, h: 10});

    focusManager.setContentFocusables([
            A,
         B,
      C
    ]);

    testInput(A, up, B);
    testInput(A, right, B);
    testInput(B, up, C);
    testInput(B, right, C);
    testInput(C, up, C);
    testInput(C, right, C);
    testInput(C, down, B);
    testInput(C, left, B);
    testInput(B, down, A);
    testInput(B, left, A);
  });

  test("test stepping up and down", () => {
    const A = newFocusable({id: "A", x: 30, y: 10, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 10, y: 30, w: 10, h: 10});
    const C = newFocusable({id: "C", x: 90, y: 90, w: 10, h: 10});

    focusManager.setContentFocusables([
         A,
      B,
            C
    ]);

    testInput(A, down, B);
    testInput(A, left, B);
    testInput(B, up, A);
    testInput(B, right, A);
    testInput(B, down, C);
    testInput(C, up, B);
    testInput(C, left, A);
    testInput(A, left, B);
  });

  test("test button square with center", () => {
    const A = newFocusable({id: "A", x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 100, y: 10, w: 10, h: 10});
    const C = newFocusable({id: "C", x: 50, y: 50, w: 10, h: 10});
    const D = newFocusable({id: "D", x: 10, y: 100, w: 10, h: 10});
    const E = newFocusable({id: "E", x: 100, y: 100, w: 10, h: 10});

    focusManager.setContentFocusables([
      A,  B,
        C,
      D,  E
    ]);

    testInput(A, left, A);
    testInput(A, down, D);
    testInput(D, up, A);
    testInput(A, right, B);
    testInput(B, left, A);
    testInput(B, down, E);
    testInput(E, left, D);

    testInput(C, down, D);
    testInput(C, up, A);
    testInput(C, left, A);
    testInput(C, right, B);
  });

  test("test right to closest row", () => {
    const A = newFocusable({id: "A", x: 10, y: 10, w: 40, h: 5});
    const B = newFocusable({id: "B", x: 100, y: 10, w: 40, h: 5});
    const C = newFocusable({id: "C", x: 10, y: 30, w: 40, h: 5});
    const D = newFocusable({id: "D", x: 10, y: 90, w: 40, h: 5});

    focusManager.setContentFocusables([
      A, B,
      C,
      D]);

    testInput(A, right, B);
    testInput(A, down, C);
    testInput(C, up, A);
    testInput(C, right, B);
    testInput(B, down, C);
  });

  test("test closest buttons from center", () => {
    const A1 = newFocusable({id: "A1", x: 0, y: 0, w: 5, h: 5});
    const A2 = newFocusable({id: "A2", x: 10, y: 0, w: 5, h: 5});
    const A3 = newFocusable({id: "A3", x: 0, y: 10, w: 5, h: 5});
    const A4 = newFocusable({id: "A4", x: 10, y: 10, w: 5, h: 5});

    const B1 = newFocusable({id: "B1", x: 100, y: 0, w: 5, h: 5});
    const B2 = newFocusable({id: "B2", x: 110, y: 0, w: 5, h: 5});
    const B3 = newFocusable({id: "B3", x: 100, y: 10, w: 5, h: 5});
    const B4 = newFocusable({id: "B4", x: 110, y: 10, w: 5, h: 5});

    const C = newFocusable({id: "C", x: 50, y: 50, w: 5, h: 5});

    const D1 = newFocusable({id: "D1", x: 0, y: 100, w: 5, h: 5});
    const D2 = newFocusable({id: "D2", x: 10, y: 100, w: 5, h: 5});
    const D3 = newFocusable({id: "D3", x: 0, y: 110, w: 5, h: 5});
    const D4 = newFocusable({id: "D4", x: 10, y: 110, w: 5, h: 5});

    const E1 = newFocusable({id: "E1", x: 100, y: 100, w: 5, h: 5});
    const E2 = newFocusable({id: "E2", x: 110, y: 100, w: 5, h: 5});
    const E3 = newFocusable({id: "E3", x: 100, y: 110, w: 5, h: 5});
    const E4 = newFocusable({id: "E4", x: 110, y: 110, w: 5, h: 5});

    focusManager.setContentFocusables([
      A1, A2,    B1, B2,
      A3, A4,    B3, B4,
              C,
      D1, D2,    E1, E2,
      D3, D4,    E3, E4]);

    testInput(A1, right, A2);
    testInput(A2, right, B1);
    testInput(A1, down, A3);
    testInput(A2, down, A4);
    testInput(A3, down, D1);
    testInput(A4, down, D2);

    testInput(B1, right, B2);
    testInput(B2, right, B2);

    testInput(D1, up, A3);
    testInput(D2, up, A4);
    testInput(D1, right, D2);
    testInput(D2, right, E1);
    testInput(D3, right, D4);
    testInput(D4, right, E3);

    testInput(E1, up, B3);
    testInput(E1, right, E2);
    testInput(E1, left, D2);
    testInput(E2, up, B4);
    testInput(E2, down, E4);
    testInput(E3, left, D4);

    testInput(C, down, D2);
    testInput(C, up, A4);
    testInput(C, left, A4);
    testInput(C, right, B3);
  });

  test("test misaligned button column", () => {
    const AAA = newFocusable({id: "AAA", x: 10, y: 10, w: 5, h: 10});
    const BBB = newFocusable({id: "BBB", x: 12, y: 20, w: 5, h: 5});
    const CCC = newFocusable({id: "CCC", x: 10, y: 30, w: 5, h: 5});

    focusManager.setContentFocusables([
      AAA,
       BBB,
      CCC]);

    testInput(AAA, right, AAA);
    testInput(AAA, down, BBB);
    testInput(CCC, up, BBB);
    testInput(BBB, up, AAA);
    testInput(BBB, down, CCC);
    testInput(BBB,left, BBB);
  });

  test("test button completely covering another", () => {
    const AAA = newFocusable({id: "AAA", x: 10, y: 10, w: 100, h: 100});
    const BBB = newFocusable({id: "BBB", x: 50, y: 50, w: 10, h: 10});

    // AAAAAAAAAAAAAAAA
    // A              A
    // A     BBBB     A
    // A              A
    // AAAAAAAAAAAAAAAA
    focusManager.setContentFocusables([
       AAA, BBB
    ]);

    testInput(AAA, right, AAA);
    testInput(AAA, down, AAA);
    testInput(AAA, up, AAA);
    testInput(AAA, left, AAA);

    // Should not be possible to get to BBB, but if it happened, perhaps with autofocus:
    testInput(BBB, right, BBB);
    testInput(BBB, down, BBB);
    testInput(BBB, up, BBB);
    testInput(BBB, left, BBB);
  });

  test("test multiple matches in focus column", () => {
    const AAA = newFocusable({id: "AAA", x: 30, y: 10, w: 10, h: 10});
    const BBB = newFocusable({id: "BBB", x: 80, y: 10, w: 10, h: 10});
    const ZZZZZZZZZZZZ = newFocusable({id: "ZZZZZZZZZZZZ", x: 10, y: 30, w: 100, h: 10});
    const DDDD = newFocusable({id: "DDDD", x: 5, y: 60, w: 30, h: 10});
    const EEE = newFocusable({id: "EEE", x: 50, y: 60, w: 20, h: 10});

    focusManager.setContentFocusables([
         AAA, BBB,
       ZZZZZZZZZZZZ,
      DDDD, EEE
    ]);

    testInput(AAA, down, ZZZZZZZZZZZZ);
    testInput(BBB, down, ZZZZZZZZZZZZ);

    testInput(AAA, left, AAA);
    testInput(AAA, right, BBB);

    testInput(ZZZZZZZZZZZZ, up, AAA);

    // align B is exactly with Z's right edge, which makes it a closer match
    const origBx = BBB.element.x;
    BBB.element.setX(ZZZZZZZZZZZZ.element.right - BBB.element.width);
    testInput(ZZZZZZZZZZZZ, up, BBB);

    BBB.element.setX(origBx);
    AAA.element.setX(ZZZZZZZZZZZZ.element.x - AAA.element.width + 2); // overlap just a bit with Z's left edge
    testInput(ZZZZZZZZZZZZ, up, AAA);

    // Competing equal distance defer to the left most
    AAA.element.setX(ZZZZZZZZZZZZ.element.x - AAA.element.width);
    BBB.element.setX(ZZZZZZZZZZZZ.element.right - BBB.element.width);
    testInput(ZZZZZZZZZZZZ, up, AAA);

    // Make B hang off of Z' right edge a bit, should not be reached moving right.
    BBB.element.setX(ZZZZZZZZZZZZ.element.right - 2);
    testInput(ZZZZZZZZZZZZ, right, ZZZZZZZZZZZZ);

    testInput(ZZZZZZZZZZZZ, down, EEE);
    EEE.element.setX(EEE.element.x + 10); // move a bit more off center
    testInput(ZZZZZZZZZZZZ, down, DDDD); // D is now closer to Z's left edge
  });

  // I.e, like above but rotated.
  test("test multiple matches in focus row", () => {
    const A = newFocusable({id: "A", x: 10, y: 30, w: 10, h: 10});
    const B = newFocusable({id: "B", x: 10, y: 80, w: 10, h: 10});
    const Z = newFocusable({id: "Z", x: 30, y: 10, w: 10, h: 100});
    const D = newFocusable({id: "D", x: 60, y: 5, w: 10, h: 30});
    const E = newFocusable({id: "E", x: 60, y: 50, w: 10, h: 20});

    focusManager.setContentFocusables([
            Z,
      A, /* Z */ D,
         /* Z */
      B, /* Z */ E
         /* Z */
    ]);

    testInput(A, right, Z);
    testInput(B, right, Z);

    testInput(A, up, A);
    testInput(A, down, B);

    testInput(Z, left, A);

    // align B is exactly with Z's bottom edge, which makes it a closer match
    const origBy = B.element.y;
    B.element.setY(Z.element.bottom - B.element.height);
    testInput(Z, left, B);

    B.element.setY(origBy);
    A.element.setY(Z.element.y - A.element.height + 2); // overlap just a bit with Z's left edge
    testInput(Z, left, A);

    // Competing equal distance defer to the left most
    A.element.setY(Z.element.y - A.element.height);
    B.element.setY(Z.element.bottom - B.element.height);
    testInput(Z, up, A);

    // Make B hang off of Z' bottom edge a bit, should not be reached moving down.
    B.element.setY(Z.element.bottom - 2);
    testInput(Z, down, Z);

    testInput(Z, right, E);
    E.element.setY(E.element.y + 10); // move a bit more off center
    testInput(Z, right, D); // D is now closer to Z's top edge
  });
});
