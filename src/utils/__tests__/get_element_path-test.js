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

    let videoContainer = document.createElement("div");
    videoContainer.id = 'videoContainer';
    document.body.appendChild(videoContainer);

    let testImg = document.createElement("img");
    videoContainer.appendChild(testImg);

    let testVideo = document.createElement("video");
    testVideo.className = 'hasFocus';
    videoContainer.appendChild(testVideo);

    expect(getElementPath(document.body)).toBe('body');
    expect(getElementPath(document.body.parentNode)).toBe('html');

    expect(getElementPath(testDiv1)).toBe('#focus1');
    expect(getElementPath(testDiv2)).toBe('body div[1].actionButton.hasFocus');
    expect(getElementPath(testDiv4)).toBe('body div[3].actionButton');
    expect(getElementPath(testDiv5)).toBe('body div[4]');

    expect(getElementPath(testImg)).toBe('#videoContainer img');
    expect(getElementPath(testVideo)).toBe('#videoContainer video.hasFocus');
});
