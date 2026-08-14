import { describe, test } from 'node:test';
import assert from 'node:assert';
import { AppStorage } from "../app-storage.js";
import 'global-jsdom/register';

describe("AppStorage", () => {
  const appStorage = new AppStorage();
  test("AppStorage setItem", () => {
    appStorage.setItem("test1", "storage1");
    assert.strictEqual(appStorage.getItem("test1"), "storage1");
    appStorage.setItem("test2", JSON.stringify(["storage2, storage3"]));
    var test2Result = JSON.parse(appStorage.getItem("test2"));
    assert.deepStrictEqual(test2Result, ["storage2, storage3"]);
    appStorage.removeItem("test1");
    assert.strictEqual(appStorage.getItem("test1"), null);
    appStorage.removeItem("test2");
    assert.strictEqual(appStorage.getItem("test2"), null);
  });
  test("AppStorage with null localStorage", () => {
    global.localStorage = null;
    appStorage.setItem("test3", "storage4");
    assert.strictEqual(appStorage.getItem("test3"), "storage4");
    appStorage.setItem("test4", JSON.stringify(["storage5, storage6"]));
    var test4Result = JSON.parse(appStorage.getItem("test4"));
    assert.deepStrictEqual(test4Result, ["storage5, storage6"]);
    appStorage.removeItem("test3");
    assert.strictEqual(appStorage.getItem("test3"), null);
    appStorage.removeItem("test4");
    assert.strictEqual(appStorage.getItem("test4"), null);
  });
});
