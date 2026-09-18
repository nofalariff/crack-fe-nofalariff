import { describe, expect, it } from "vitest"

import { safeRedirectPath } from "./safe-redirect"

describe("safeRedirectPath", () => {
  it("meneruskan path internal", () => {
    expect(safeRedirectPath("/kiriman/abc?tab=1", "/dashboard")).toBe(
      "/kiriman/abc?tab=1"
    )
  })

  it("memakai fallback bila kosong", () => {
    expect(safeRedirectPath("", "/dashboard")).toBe("/dashboard")
    expect(safeRedirectPath(null, "/admin")).toBe("/admin")
  })

  it("menolak tujuan di luar situs", () => {
    for (const next of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "javascript:alert(1)",
      "evil.com",
    ]) {
      expect(safeRedirectPath(next, "/dashboard")).toBe("/dashboard")
    }
  })
})
