/**
 * Centralized display name helpers for provider and account/connection labels.
 *
 * Prevents raw internal IDs (connection UUIDs, dynamic provider IDs) from
 * leaking into user-facing dashboards (Health, Analytics, Sessions, Rate-limits,
 * Quota, Compatible Provider pages, etc.).
 *
 * Priority order:
 *   — Account: name → displayName → email → short readble label
 *   — Provider: node.name → node.prefix → alias → readable ID
 *
 * @module lib/display/names
 */

import { isCompatibleProviderConnectionId } from "@/shared/utils/compatibleProviderId";
import {
  isClaudeCodeCompatibleProvider,
  isOpenAICompatibleProvider,
  isAnthropicCompatibleProvider,
} from "@/shared/constants/providers";

export interface ConnectionLike {
  id?: string | null;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export interface ProviderNodeLike {
  name?: string | null;
  prefix?: string | null;
}

/**
 * Friendly display name for an account/connection.
 *
 * Priority: name → displayName → email → "Account #<6-char ID>"
 */
export function getAccountDisplayName(conn: ConnectionLike): string {
  if (!conn) return "Unknown Account";
  const name =
    (typeof conn.name === "string" && conn.name.trim()) ||
    (typeof conn.displayName === "string" && conn.displayName.trim()) ||
    (typeof conn.email === "string" && conn.email.trim());
  if (name) return name;
  if (typeof conn.id === "string" && conn.id) {
    return `Account #${conn.id.slice(0, 6)}`;
  }
  return "Unknown Account";
}

/**
 * Friendly display name for a provider node/ID.
 *
 * Priority: node.name → node.prefix → de-UUIDed providerId
 *
 * Dynamic compatible provider IDs like
 *   "openai-compatible-chat-02669115-2545-4896-b003-cb4dac09d441"
 * are rendered as "Compatible (openai)".
 */
export function getProviderDisplayName(
  providerId: string | null | undefined,
  providerNode?: ProviderNodeLike | null
): string {
  if (providerNode?.name?.trim()) return providerNode.name.trim();
  if (providerNode?.prefix?.trim()) return providerNode.prefix.trim();
  if (!providerId) return "Unknown Provider";

  // Simplify dynamic compatible provider IDs (all 4 generated shapes — #8326)
  if (isCompatibleProviderConnectionId(providerId)) {
    if (isClaudeCodeCompatibleProvider(providerId)) return "CC Compatible";
    if (isOpenAICompatibleProvider(providerId)) return "Compatible (openai)";
    if (isAnthropicCompatibleProvider(providerId)) return "Compatible (anthropic)";
  }

  return providerId;
}

/**
 * Friendly display name for a model string.
 *
 * Prevents verbose internal provider IDs / UUIDs (such as
 * "openai-compatible-chat-bb3c0021-7f50-4471-bc5c-75d9d2c6b8b2/agnes-2.5-flash")
 * from cluttering dashboards, combo cards, or test result views.
 */
export function getModelDisplayName(
  rawModel: string | null | undefined,
  providerNode?: ProviderNodeLike | null
): string {
  if (!rawModel || typeof rawModel !== "string") return "";
  const trimmed = rawModel.trim();
  const slashIdx = trimmed.indexOf("/");
  if (slashIdx === -1) {
    if (isCompatibleProviderConnectionId(trimmed)) {
      return getProviderDisplayName(trimmed, providerNode);
    }
    return trimmed;
  }

  const providerPart = trimmed.slice(0, slashIdx);
  const modelPart = trimmed.slice(slashIdx + 1);

  // If a friendly provider node name is available, show "NodeName / model"
  if (providerNode?.name?.trim()) {
    return `${providerNode.name.trim()} / ${modelPart}`;
  }

  // Strip dynamic compatible provider IDs or any provider ID containing UUIDs
  const isCompatible =
    isCompatibleProviderConnectionId(providerPart) ||
    providerPart.startsWith("openai-compatible-") ||
    providerPart.startsWith("anthropic-compatible-");
  const hasUuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
    providerPart
  );

  if (isCompatible || hasUuid) {
    return modelPart || trimmed;
  }

  return trimmed;
}
