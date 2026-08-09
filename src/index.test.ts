import { describe, expect, it } from "vitest";
import * as index from "./index.js";

describe("public entry point", () => {
  it("exposes the component as both the default and a named export", () => {
    expect(index.default).toEqual(expect.any(Object));
    expect(index.DatePicker).toBe(index.default);
  });
});
