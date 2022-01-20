import { TXMFocusManager } from "../txm_focus_manager";
import { Focusable } from "../txm_focusable";
import { inputActions } from "../txm_input_actions";

describe("complex navigation tests", () => {

  const focusManager = new TXMFocusManager();

  const up = inputActions.moveUp;
  const down = inputActions.moveDown;
  const left = inputActions.moveLeft;
  const right = inputActions.moveRight;

  // Creates a focusable element stub that can be positioned and sized.
  function newFocusable(id, bounds = {x: 0, y: 0, w: 0, h: 0}) {
    const element = { id };
    element.classList = {
      add: () => {},
      remove: () => {}
    };

    element.getBoundingClientRect = () => element;

    element.setBounds = function({x = this.x || 0, y = this.y || 0, w = this.width || 0, h = this.height || 0}) {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
      this.left = x;
      this.top = y;
      this.right = x + w;
      this.bottom = y + h;
    };

    element.setBounds(bounds);

    return new Focusable(element);
  }

  function testInput(currFocus, action, newFocus) {
    focusManager.setFocus(currFocus);
    focusManager.onInputAction(action);
    if (!newFocus) newFocus = currFocus; // unspecified means no change to focus
    expect(focusManager.currentFocus).toBe(newFocus);
  }

  function testAllInputs(currFocus, leftFocus, rightFocus, upFocus, downFocus) {
    testInput(currFocus, left, leftFocus);
    testInput(currFocus, right, rightFocus);
    testInput(currFocus, up, upFocus);
    testInput(currFocus, down, downFocus);
  }

  test("test focus grid with overlaps, gaps", () => {
    const f_0_0 = newFocusable("f_0_0", {x: 10, y: 10, w: 40, h: 30});
    const f_0_2 = newFocusable("f_0_2", {x: 60, y: 10, w: 40, h: 30});
    const f_1_2 = newFocusable("f_1_2", {x: 55, y: 40, w: 55, h: 40}); // overlaps
    const f_2_4 = newFocusable("f_2_4", {x: 110, y: 70, w: 40, h: 40});  // overlaps
    const f_3_0 = newFocusable("f_3_0", {x: 10, y: 115, w: 50, h: 40});
    const f_3_1 = newFocusable("f_3_1", {x: 60, y: 115, w: 50, h: 40});
    const f_3_3 = newFocusable("f_3_3", {x: 115, y: 115, w: 40, h: 40});
    const f_4_5 = newFocusable("f_4_5", {x: 200, y: 400, w: 40, h: 40});

    // Note: all focus navigation is done by finding the visually closest match, first in the implied focus row/col
    // falling back to the next leftmost/topmost item in the following row/col.
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
    const A = newFocusable("A", {x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 30, y: 10, w: 10, h: 10});
    const C = newFocusable("C", {x: 50, y: 10, w: 10, h: 10});
    const D = newFocusable("D", {x: 10, y: 30, w: 10, h: 10});
    const E = newFocusable("E", {x: 30, y: 30, w: 10, h: 10});
    const F = newFocusable("F", {x: 50, y: 30, w: 10, h: 10});

    focusManager.setContentFocusables([
      A, B, C,
      D, E, F,
    ]);

    testAllInputs(A, A, B, A, D);
    testAllInputs(B, A, C, B, E);
    testAllInputs(C, B, C, C, F);
    testAllInputs(D, D, E, A, D);
    testAllInputs(E, D, F, B, E);
    testAllInputs(F, E, F, C, F);
  });

  test("test simple focus grid, adjacent buttons", () => {
    const A = newFocusable("A", {x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 20, y: 10, w: 10, h: 10});
    const C = newFocusable("C", {x: 30, y: 10, w: 10, h: 10});
    const D = newFocusable("D", {x: 10, y: 20, w: 10, h: 10});
    const E = newFocusable("E", {x: 20, y: 20, w: 10, h: 10});
    const F = newFocusable("F", {x: 30, y: 20, w: 10, h: 10});

    focusManager.setContentFocusables([
      A,B,C,
      D,E,F,
    ]);

    testAllInputs(A, A, B, A, D);
    testAllInputs(B, A, C, B, E);
    testAllInputs(C, B, C, C, F);
    testAllInputs(D, D, E, A, D);
    testAllInputs(E, D, F, B, E);
    testAllInputs(F, E, F, C, F);
  });

  test("test items are touching edges and all in focus lane", () => {
    const AAAAAAA = newFocusable("AAAAAAA", {x: 10, y: 10, w: 50, h: 10});
    const B = newFocusable("B", {x: 10, y: 20, w: 10, h: 10});
    const C = newFocusable("C", {x: 30, y: 20, w: 10, h: 10});
    const D = newFocusable("D", {x: 50, y: 20, w: 10, h: 10});

    focusManager.setContentFocusables([
      AAAAAAA,
      B, C, D
    ]);

    testAllInputs(AAAAAAA, null, null, null, B);
    testAllInputs(B, null, C, AAAAAAA, null);
    testAllInputs(C, B, D, AAAAAAA, null);
    testAllInputs(D, C, null, AAAAAAA, null);
  });

  test("test A kitty corner B", () => {
    const A = newFocusable("A", {x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 30, y: 30, w: 10, h: 10});

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
    const A = newFocusable("A", {x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 30, y: 30, w: 10, h: 10});
    const C = newFocusable("C", {x: 90, y: 90, w: 10, h: 10});

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
    const A = newFocusable("A", {x: 90, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 30, y: 30, w: 10, h: 10});
    const C = newFocusable("C", {x: 10, y: 90, w: 10, h: 10});

    focusManager.setContentFocusables([
            A,
         B,
      C
    ]);

    testInput(A, up, A);
    testInput(A, down, B);
    testInput(B, up, A);
    testInput(B, right, A);
    testInput(B, down, C);
    testInput(B, left, C);
    testInput(C, up, B);
    testInput(C, right, B);
    testInput(C, down, C);
    testInput(C, left, C);
  });

  test("test stepping up and down", () => {
    const A = newFocusable("A", {x: 30, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 10, y: 900, w: 10, h: 10});
    const C = newFocusable("C", {x: 90, y: 1000, w: 10, h: 10});

    focusManager.setContentFocusables([
         A,
    // ... 880 pixels to top of B
      B,
            C
    ]);

    testInput(A, down, B);
    testInput(A, left, B);
    testInput(B, up, A);
    testInput(B, right, C); // C is vertically closer to the focus lane moving right from B.
    testInput(B, down, C);
    testInput(C, up, A); // A is horizontally closer to the focus lane moving up from C
    testInput(C, left, B); // B is vertically closer to the focus lane moving left from C
    testInput(A, left, B);
  });

  test("test button square with center", () => {
    const A = newFocusable("A", {x: 10, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 100, y: 10, w: 10, h: 10});
    const C = newFocusable("C", {x: 50, y: 50, w: 10, h: 10});
    const D = newFocusable("D", {x: 10, y: 100, w: 10, h: 10});
    const E = newFocusable("E", {x: 100, y: 100, w: 10, h: 10});

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
    const A = newFocusable("A", {x: 10, y: 10, w: 40, h: 5});
    const B = newFocusable("B", {x: 100, y: 10, w: 40, h: 5});
    const C = newFocusable("C", {x: 10, y: 30, w: 40, h: 5});
    const D = newFocusable("D", {x: 10, y: 90, w: 40, h: 5});

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

  test("test row along then column up", () => {
    const A = newFocusable("A", {x: 90, y: 10, w: 10, h: 10});
    const B = newFocusable("B", {x: 90, y: 30, w: 10, h: 10});
    const C = newFocusable("C", {x: 90, y: 60, w: 10, h: 10});
    const D = newFocusable("D", {x: 10, y: 90, w: 10, h: 10});
    const E = newFocusable("E", {x: 30, y: 90, w: 10, h: 10});
    const F = newFocusable("F", {x: 60, y: 90, w: 10, h: 10});
    const G = newFocusable("G", {x: 90, y: 90, w: 10, h: 10});

    focusManager.setContentFocusables([
               A,
               B,
               C,
      D, E, F, G
    ]);

    testInput(A, right, A);
    testInput(A, left, F);
    testInput(A, down, B);
    testInput(A, up, A);

    testInput(B, right, B);
    testInput(B, left, F);
    testInput(B, down, C);
    testInput(B, up, A);

    testInput(C, right, C);
    testInput(C, left, F);
    testInput(C, down, G);
    testInput(C, up, B);

    testInput(D, left, D);
    testInput(D, right, E);
    testInput(D, down, D);
    testInput(D, up, C);

    testInput(E, left, D);
    testInput(E, right, F);
    testInput(E, down, E);
    testInput(E, up, C);

    testInput(F, left, E);
    testInput(F, right, G);
    testInput(F, down, F);
    testInput(F, up, C);

    testInput(G, left, F);
    testInput(G, right, G);
    testInput(G, down, G);
    testInput(G, up, C);
  });

  test("test closest buttons from center", () => {
    const A1 = newFocusable("A1", {x: 0, y: 0, w: 5, h: 5});
    const A2 = newFocusable("A2", {x: 10, y: 0, w: 5, h: 5});
    const A3 = newFocusable("A3", {x: 0, y: 10, w: 5, h: 5});
    const A4 = newFocusable("A4", {x: 10, y: 10, w: 5, h: 5});

    const B1 = newFocusable("B1", {x: 100, y: 0, w: 5, h: 5});
    const B2 = newFocusable("B2", {x: 110, y: 0, w: 5, h: 5});
    const B3 = newFocusable("B3", {x: 100, y: 10, w: 5, h: 5});
    const B4 = newFocusable("B4", {x: 110, y: 10, w: 5, h: 5});

    const C = newFocusable("C", {x: 50, y: 50, w: 5, h: 5});

    const D1 = newFocusable("D1", {x: 0, y: 100, w: 5, h: 5});
    const D2 = newFocusable("D2", {x: 10, y: 100, w: 5, h: 5});
    const D3 = newFocusable("D3", {x: 0, y: 110, w: 5, h: 5});
    const D4 = newFocusable("D4", {x: 10, y: 110, w: 5, h: 5});

    const E1 = newFocusable("E1", {x: 100, y: 100, w: 5, h: 5});
    const E2 = newFocusable("E2", {x: 110, y: 100, w: 5, h: 5});
    const E3 = newFocusable("E3", {x: 100, y: 110, w: 5, h: 5});
    const E4 = newFocusable("E4", {x: 110, y: 110, w: 5, h: 5});

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
    const AAA = newFocusable("AAA", {x: 10, y: 10, w: 5, h: 10});
    const BBB = newFocusable("BBB", {x: 12, y: 20, w: 5, h: 5});
    const CCC = newFocusable("CCC", {x: 10, y: 30, w: 5, h: 5});

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

  test("test misaligned button row", () => {
    const AA = newFocusable("AA", {x: 10, y: 0, w: 5, h: 20});
    const BB = newFocusable("BB", {x: 0, y: 10, w: 5, h: 20});
    const CC = newFocusable("CC", {x: 20, y: 10, w: 5, h: 20});

    //   A
    // B A C
    // B   C
    focusManager.setContentFocusables([BB, AA, CC]);

    testInput(AA, left, BB);
    testInput(AA, right, CC);
    testInput(AA, up, AA);
    testInput(AA, down, AA);
    testInput(BB, up, BB);
    testInput(BB, down, BB);
    testInput(BB, left, BB);
    testInput(BB, right, AA);
    testInput(CC, up, CC);
    testInput(CC, down, CC);
    testInput(CC, left, AA);
    testInput(CC, right, CC);
  });

  test("test multiple matches in focus column", () => {
    const AAA = newFocusable("AAA", {x: 30, y: 10, w: 10, h: 10});
    const BBB = newFocusable("BBB", {x: 80, y: 10, w: 10, h: 10});
    const ZZZZZZZZZZZZ = newFocusable("ZZZZZZZZZZZZ", {x: 10, y: 30, w: 100, h: 10});
    const DDDD = newFocusable("DDDD", {x: 5, y: 60, w: 30, h: 10});
    const EEE = newFocusable("EEE", {x: 50, y: 60, w: 20, h: 10});

    focusManager.setContentFocusables([
         AAA, BBB,
       ZZZZZZZZZZZZ,
      DDDD, EEE
    ]);

    testInput(AAA, left, AAA);
    testInput(AAA, right, BBB);

    testInput(AAA, down, ZZZZZZZZZZZZ);
    testInput(BBB, down, ZZZZZZZZZZZZ);

    testInput(ZZZZZZZZZZZZ, up, AAA);
    testInput(ZZZZZZZZZZZZ, down, DDDD);
    testInput(ZZZZZZZZZZZZ, left, ZZZZZZZZZZZZ);
    testInput(ZZZZZZZZZZZZ, right, ZZZZZZZZZZZZ);

    // Move A and D outside of focus lane.
    AAA.element.setBounds({x: ZZZZZZZZZZZZ.element.x - AAA.element.width});
    DDDD.element.setBounds({x: ZZZZZZZZZZZZ.element.x - DDDD.element.width});
    testInput(ZZZZZZZZZZZZ, up, BBB);
    testInput(ZZZZZZZZZZZZ, down, EEE);
  });

  // I.e, like above but rotated.
  test("test multiple matches in focus row", () => {
    const A = newFocusable("A", {x: 10, y: 30, w: 10, h: 10});
    const B = newFocusable("B", {x: 10, y: 80, w: 10, h: 10});
    const Z = newFocusable("Z", {x: 30, y: 10, w: 10, h: 100});
    const D = newFocusable("D", {x: 60, y: 5, w: 10, h: 30});
    const E = newFocusable("E", {x: 60, y: 50, w: 10, h: 20});

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
    testInput(Z, right, D);
    testInput(Z, up, Z);
    testInput(Z, down, Z);

    // Move A and D outside of focus lane.
    A.element.setBounds({y: Z.element.y - A.element.height});
    D.element.setBounds({y: Z.element.y - D.element.height});
    testInput(Z, left, B);
    testInput(Z, right, E);
  });

  test("test closest outside focus column", () => {
    const A = newFocusable("A", {x: 10, y: 0, w: 5, h: 5});
    const B = newFocusable("B", {x: 0, y: 10, w: 5, h: 5});
    const C = newFocusable("C", {x: 20, y: 10, w: 5, h: 5});

    //   A
    // B   C
    focusManager.setContentFocusables([A, B, C]);

    testInput(A, left, B);
    testInput(A, right, C);
    testInput(A, up, A);
    testInput(A, down, B);
    testInput(B, up, A);
    testInput(B, down, B);
    testInput(B, left, B);
    testInput(B, right, C);
    testInput(C, up, A);
    testInput(C, down, C);
    testInput(C, left, B);
    testInput(C, right, C);

    // Move C closer to A's column. It should then take priority vs B.
    C.element.setBounds({x: A.element.right + 1});
    testInput(A, down, C);
  });

  test("test button completely covering another", () => {
    const AAA = newFocusable("AAA", {x: 10, y: 10, w: 100, h: 100});
    const BBB = newFocusable("BBB", {x: 50, y: 50, w: 10, h: 10});

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
    testInput(BBB, right, AAA);
    testInput(BBB, down, AAA);
    testInput(BBB, up, AAA);
    testInput(BBB, left, AAA);
  });

  test("test button overlaps another", () => {
    const AAA = newFocusable("AAA", {x: 10, y: 10, w: 100, h: 100});
    const BBB = newFocusable("BBB", {x: 80, y: 10, w: 100, h: 100});

    // AAAAAABBBBBBBBBB
    // A     B  A     B
    // A     B  A     B
    // AAAAAABBBBBBBBBB
    focusManager.setContentFocusables([
      AAA, BBB
    ]);

    testInput(AAA, left, AAA);
    testInput(AAA, right, BBB);
    testInput(AAA, down, AAA);
    testInput(AAA, up, AAA);
    testInput(BBB, left, AAA);
    testInput(BBB, down, BBB);
    testInput(BBB, up, BBB);
    testInput(BBB, right, BBB);
  });

  test("test button overlaps another both right and down", () => {
    const AAA = newFocusable("AAA", {x: 10, y: 10, w: 100, h: 100});
    const BBB = newFocusable("BBB", {x: 80, y: 30, w: 100, h: 100});

    // AAAAAAAAAAA
    // A         A
    // A     BBBBBBBBBBBBBB
    // A     B   A        B
    // AAAAAABAAAA        B
    //       B            B
    //       BBBBBBBBBBBBBB
    focusManager.setContentFocusables([
      AAA, BBB
    ]);

    testInput(AAA, left, AAA);
    testInput(AAA, right, BBB);
    testInput(AAA, down, BBB);
    testInput(AAA, up, AAA);
    testInput(BBB, left, AAA);
    testInput(BBB, down, BBB);
    testInput(BBB, up, AAA);
    testInput(BBB, right, BBB);
  });

  test("test button overlaps another both right and up", () => {
    const AAA = newFocusable("AAA", {x: 80, y: 10, w: 100, h: 100});
    const BBB = newFocusable("BBB", {x: 10, y: 30, w: 100, h: 100});

    //       AAAAAAAAAAAAAA
    //       A            A
    // BBBBBBABBBB        A
    // B     A   B        A
    // B     AAAAAAAAAAAAAA
    // B         B
    // BBBBBBBBBBB
    focusManager.setContentFocusables([
      AAA, BBB
    ]);

    testInput(AAA, left, BBB);
    testInput(AAA, right, AAA);
    testInput(AAA, down, BBB);
    testInput(AAA, up, AAA);
    testInput(BBB, left, BBB);
    testInput(BBB, right, AAA);
    testInput(BBB, down, BBB);
    testInput(BBB, up, AAA);
  });

  test("test survey with help vs exit ad in footer", () => {
    const A = newFocusable("A", {x: 100, y: 10, w: 50, h: 50});
    const B = newFocusable("B", {x: 200, y: 10, w: 50, h: 50});
    const C = newFocusable("C", {x: 300, y: 10, w: 50, h: 50});

    const help = newFocusable("Help", {x: 10, y: 100, w: 50, h: 20});

    const exitAd = newFocusable("exitAd", {x: 300, y: 1000, w: 50, h: 20});
    const thumbsUp = newFocusable("thumbsUp", {x: 260, y: 1000, w: 10, h: 10});
    const thumbsDown = newFocusable("thumbsDown", {x: 280, y: 1000, w: 10, h: 10});

    focusManager.setContentFocusables([
            A, B, C,
      help
    ]);

    testAllInputs(A, help, B, null, help);
    testAllInputs(B, A, C, null, help);
    testAllInputs(C, B, null, null, help);
    testAllInputs(help, null, A, A, null);

    // Now show the footer, navigation to exit button should be natural as per focus lane rules,
    // but only on move down. thumbs up/down buttons should not be considered.
    focusManager.setBottomChromeFocusables([thumbsUp, thumbsDown, exitAd], exitAd);

    testAllInputs(A, help, B, null, help); // help is closer to the down focus lane of A
    testAllInputs(B, A, C, null, exitAd);
    testAllInputs(C, B, null, null, exitAd);
    testAllInputs(help, null, A, A, exitAd);

    testAllInputs(help, null, A, A, exitAd);

    // help is now the last content focus, and thus the return target moving off of the footer:
    testAllInputs(exitAd, thumbsDown, null, help, null);
    testAllInputs(thumbsDown, thumbsUp, exitAd, help, null);
  });

});
