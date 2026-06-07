import { jest, describe, it, expect } from "@jest/globals";
import { getCompanyBrand } from "../../company.js";

describe("getCompanyBrand", () => {
  it("should return BMW brand", () => {
    expect(getCompanyBrand()).toBe("BMW TechWorks Romania");
  });
});
