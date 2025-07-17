import { expect, test } from "@playwright/test";

import { setupTest } from "../test-helpers";

test("basic smoke test dev", async ({ page: _page }) => {
  using page = await setupTest(_page, "dev", import.meta.dirname);

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(await response?.text()).toEqual("Hello from the worker pool!");
});

test("basic smoke test prod", async ({ page: _page }) => {
  using page = await setupTest(_page, "prod", import.meta.dirname);

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(await response?.text()).toEqual("Hello from the worker pool!");
});
