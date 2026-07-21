import { describe, it, expect } from "vitest";
import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@shared/_core/errors";

describe("HttpError", () => {
  it("creates an error with code and message", () => {
    const err = new HttpError(418, "Teapot");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("Teapot");
    expect(err.name).toBe("HttpError");
  });
});

describe("BadRequestError", () => {
  it("returns 400 HttpError", () => {
    const err = BadRequestError("bad input");
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad input");
  });
});

describe("UnauthorizedError", () => {
  it("returns 401 HttpError", () => {
    const err = UnauthorizedError("no token");
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("no token");
  });
});

describe("ForbiddenError", () => {
  it("returns 403 HttpError", () => {
    const err = ForbiddenError("not admin");
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("not admin");
  });
});

describe("NotFoundError", () => {
  it("returns 404 HttpError", () => {
    const err = NotFoundError("missing");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("missing");
  });

  it("is instanceof HttpError and Error", () => {
    const err = NotFoundError("x");
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toBeInstanceOf(Error);
  });
});
