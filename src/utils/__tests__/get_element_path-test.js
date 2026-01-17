import { test } from 'node:test';
import assert from 'node:assert';
import { getElementPath } from '../get_element_path.js';

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

    assert.strictEqual(getElementPath(document.body), 'body');
    assert.strictEqual(getElementPath(document.body.parentNode), 'html');

    assert.strictEqual(getElementPath(testDiv1), '#focus1');
    assert.strictEqual(getElementPath(testDiv2), 'body div[1].actionButton.hasFocus');
    assert.strictEqual(getElementPath(testDiv4), 'body div[3].actionButton');
    assert.strictEqual(getElementPath(testDiv5), 'body div[4]');

    assert.strictEqual(getElementPath(testImg), '#videoContainer img');
    assert.strictEqual(getElementPath(testVideo), '#videoContainer video.hasFocus');
});
