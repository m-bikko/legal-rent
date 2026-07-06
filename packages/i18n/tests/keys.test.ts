import ru from "../src/ru.json";
import kk from "../src/kk.json";
import en from "../src/en.json";

type Tree = { [key: string]: string | Tree };

const flattenKeys = (obj: Tree, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flattenKeys(value, path);
  });

describe("i18n dictionaries", () => {
  const ruKeys = flattenKeys(ru).sort();

  it("kk has identical key set to ru", () => {
    expect(flattenKeys(kk).sort()).toEqual(ruKeys);
  });

  it("en has identical key set to ru", () => {
    expect(flattenKeys(en).sort()).toEqual(ruKeys);
  });

  it("no empty translations", () => {
    for (const dict of [ru, kk, en]) {
      for (const key of flattenKeys(dict)) {
        const value = key.split(".").reduce<unknown>((acc, part) => (acc as Tree)[part], dict);
        expect(typeof value).toBe("string");
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });
});
