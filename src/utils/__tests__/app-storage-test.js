import { AppStorage } from "../app-storage";

describe("AppStorage", () => {
  const appStorage = new AppStorage();
  test("AppStorage setItem", () => {
    appStorage.setItem("test1", "storage1");
    expect(appStorage.getItem("test1")).toBe("storage1");
    appStorage.setItem("test2", JSON.stringify(["storage2, storage3"]));
    var test2Result = JSON.parse(appStorage.getItem("test2"));
    expect(test2Result).toStrictEqual(["storage2, storage3"]);
    appStorage.removeItem("test1");
    expect(appStorage.getItem("test1")).toBeNull();
    appStorage.removeItem("test2");
    expect(appStorage.getItem("test2")).toBeNull();

    localStorage = null;
    appStorage.setItem("test3", "storage4");
    expect(appStorage.getItem("test3")).toBe("storage4");
    appStorage.setItem("test4", JSON.stringify(["storage5, storage6"]));
    var test4Result = JSON.parse(appStorage.getItem("test4"));
    expect(test4Result).toStrictEqual(["storage5, storage6"]);
    appStorage.removeItem("test3");
    expect(appStorage.getItem("test3")).toBeNull();
    appStorage.removeItem("test4");
    expect(appStorage.getItem("test4")).toBeNull();
  });
});