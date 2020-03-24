import { getElementPath } from '../get_element_path';

test('test getElementPath', () => {
    let testDiv1 = document.createElement("div");
    testDiv1.id = 'focus1';
    document.body.appendChild(testDiv1);

    let testDiv2 = document.createElement("div");
    testDiv2.className = "actionButton hasFocus";
    document.body.appendChild(testDiv2);

    let testDiv3 = document.createElement("div");
    testDiv3.className = "actionButton";
    document.body.appendChild(testDiv3);

    let testDiv4 = document.createElement("div");
    testDiv4.className = "actionButton";
    document.body.appendChild(testDiv4);

    let testDiv5 = document.createElement("div");
    document.body.appendChild(testDiv5);

    expect(getElementPath(testDiv1)).toBe('#focus1');
    expect(getElementPath(testDiv2)).toBe('.actionButton[0].hasFocus');
    expect(getElementPath(testDiv4)).toBe('.actionButton[2]');
    expect(getElementPath(testDiv5)).toBe('body div[4]');
    expect(getElementPath(document.body)).toBe('body');
    expect(getElementPath(document.body.parentNode)).toBe('html');
});
