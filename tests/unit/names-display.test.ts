import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getModelDisplayName } from "@/lib/display/names";

describe("getModelDisplayName", () => {
  it("returns empty string for null, undefined, or empty values", () => {
    assert.equal(getModelDisplayName(null), "");
    assert.equal(getModelDisplayName(undefined), "");
    assert.equal(getModelDisplayName(""), "");
  });

  it("strips dynamic compatible provider prefixes with UUIDs", () => {
    const raw = "openai-compatible-chat-bb3c0021-7f50-4471-bc5c-75d9d2c6b8b2/agnes-2.5-flash";
    assert.equal(getModelDisplayName(raw), "agnes-2.5-flash");
  });

  it("strips responses-based compatible provider prefixes with UUIDs", () => {
    const raw = "openai-compatible-responses-bb3c0021-7f50-4471-bc5c-75d9d2c6b8b2/gpt-4o";
    assert.equal(getModelDisplayName(raw), "gpt-4o");
  });

  it("strips anthropic-compatible provider prefixes with UUIDs", () => {
    const raw = "anthropic-compatible-bb3c0021-7f50-4471-bc5c-75d9d2c6b8b2/claude-3-5-sonnet";
    assert.equal(getModelDisplayName(raw), "claude-3-5-sonnet");
  });

  it("strips arbitrary provider prefix if it contains a UUID", () => {
    const raw = "custom-179334cc-43ea-4213-9c31-9810f7b3a628/agnes-3.0-flash";
    assert.equal(getModelDisplayName(raw), "agnes-3.0-flash");
  });

  it("preserves standard provider IDs without UUIDs", () => {
    const raw = "antigravity/gemini-3.7-flash-high";
    assert.equal(getModelDisplayName(raw), "antigravity/gemini-3.7-flash-high");
  });

  it("uses friendly providerNode name if supplied", () => {
    const raw = "openai-compatible-chat-bb3c0021-7f50-4471-bc5c-75d9d2c6b8b2/agnes-2.5-flash";
    const node = { name: "Agnes AI" };
    assert.equal(getModelDisplayName(raw, node), "Agnes AI / agnes-2.5-flash");
  });

  it("handles strings without slash", () => {
    assert.equal(getModelDisplayName("gpt-4o"), "gpt-4o");
    assert.equal(
      getModelDisplayName("openai-compatible-chat-bb3c0021-7f50-4471-bc5c-75d9d2c6b8b2"),
      "Compatible (openai)"
    );
  });
});
