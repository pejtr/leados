import { describe, it, expect } from "vitest";
import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  AXIOS_TIMEOUT_MS,
  UNAUTHED_ERR_MSG,
  NOT_ADMIN_ERR_MSG,
} from "../shared/const";

describe("Shared Constants", () => {
  it("COOKIE_NAME is a non-empty string", () => {
    expect(typeof COOKIE_NAME).toBe("string");
    expect(COOKIE_NAME.length).toBeGreaterThan(0);
  });

  it("ONE_YEAR_MS is approximately 365 days in milliseconds", () => {
    const days365 = 365 * 24 * 60 * 60 * 1000;
    expect(ONE_YEAR_MS).toBe(days365);
  });

  it("AXIOS_TIMEOUT_MS is 30 seconds", () => {
    expect(AXIOS_TIMEOUT_MS).toBe(30_000);
  });

  it("UNAUTHED_ERR_MSG contains a numeric code", () => {
    expect(UNAUTHED_ERR_MSG).toMatch(/\d+/);
  });

  it("NOT_ADMIN_ERR_MSG contains a numeric code", () => {
    expect(NOT_ADMIN_ERR_MSG).toMatch(/\d+/);
  });

  it("error messages are different", () => {
    expect(UNAUTHED_ERR_MSG).not.toBe(NOT_ADMIN_ERR_MSG);
  });
});
