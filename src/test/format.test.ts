import { describe, expect, it } from "vitest";
import { cleanSearch, dealPath, discountText, expiryLabel, formatLKR, safeUrl, slugify, todayLK } from "@/lib/format";

const addDays = (n: number) => {
  const [y, m, d] = todayLK().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

describe("expiryLabel", () => {
  it("counts days in Sri Lanka time", () => {
    expect(expiryLabel(addDays(0))).toBe("Ends today");
    expect(expiryLabel(addDays(1))).toBe("Ends tomorrow");
    expect(expiryLabel(addDays(5))).toBe("5 days left");
    expect(expiryLabel(addDays(-1))).toBe("Ended");
    expect(expiryLabel(addDays(30))).toMatch(/^Until /);
  });
});

describe("discountText", () => {
  it("prefers the percentage", () => {
    expect(discountText({ discount_percentage: 40, original_price: null, deal_price: null })).toBe("40%");
  });
  it("falls back to the rupee saving", () => {
    expect(discountText({ discount_percentage: 0, original_price: 5000, deal_price: 4000 })).toBe("Rs. 1,000");
  });
  it("says Offer when there is no number", () => {
    expect(discountText({ discount_percentage: 0, original_price: null, deal_price: null })).toBe("Offer");
  });
});

describe("safeUrl", () => {
  it("accepts web links and adds https", () => {
    expect(safeUrl("keells.lk/offers")).toBe("https://keells.lk/offers");
    expect(safeUrl("http://example.com")).toBe("http://example.com/");
  });
  it("rejects scripts and junk", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("")).toBeNull();
  });
});

describe("cleanSearch", () => {
  it("removes characters that break database filters", () => {
    expect(cleanSearch("pizza,(hut)*%")).toBe("pizza hut");
  });
});

describe("links and money", () => {
  it("builds readable deal links", () => {
    expect(slugify("25% off at Keells Super!")).toBe("25-off-at-keells-super");
    expect(dealPath({ id: "abc", title: "Buy 1 get 1" })).toBe("/deal/abc/buy-1-get-1");
  });
  it("formats rupees", () => {
    expect(formatLKR(132999)).toBe("Rs. 132,999");
  });
});
