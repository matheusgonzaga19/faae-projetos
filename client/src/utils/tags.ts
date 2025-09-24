import type { TaskTag } from "@/types";

export const DEFAULT_TAG_COLOR = "#2563eb";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const expandShortHex = (hex: string) =>
  `#${hex
    .slice(1)
    .split("")
    .map((char) => `${char}${char}`)
    .join("")}`;

export const normalizeTagColor = (color?: string | null): string => {
  if (!color) return DEFAULT_TAG_COLOR;

  const trimmed = color.trim();
  if (!trimmed) return DEFAULT_TAG_COLOR;

  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!HEX_COLOR_REGEX.test(prefixed)) return DEFAULT_TAG_COLOR;

  return (prefixed.length === 4 ? expandShortHex(prefixed) : prefixed).toLowerCase();
};

export const generateTagId = (prefix = "tag"): string => {
  const unique =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return prefix ? `${prefix}-${unique}` : unique;
};

const extractTagName = (raw: Record<string, unknown>): string => {
  const candidates = ["name", "label", "title", "value"] as const;

  for (const key of candidates) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const extractTagId = (raw: Record<string, unknown>): string | undefined => {
  const candidates = ["id", "tagId"] as const;

  for (const key of candidates) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const extractTagColor = (raw: Record<string, unknown>): string | undefined => {
  const candidates = ["color", "colour", "hex", "background", "backgroundColor"] as const;

  for (const key of candidates) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

export const normalizeTaskTags = (tags: unknown): TaskTag[] => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seenIds = new Set<string>();

  return tags.reduce<TaskTag[]>((acc, item, index) => {
    if (item === undefined || item === null) {
      return acc;
    }

    let normalized: TaskTag | null = null;

    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        normalized = {
          id: generateTagId(`legacy-${index}`),
          name: trimmed,
          color: DEFAULT_TAG_COLOR,
        };
      }
    } else if (typeof item === "object") {
      const raw = item as Record<string, unknown>;
      const name = extractTagName(raw);
      if (!name) {
        return acc;
      }

      const id = extractTagId(raw) ?? generateTagId(`tag-${index}`);
      const color = normalizeTagColor(extractTagColor(raw));

      normalized = {
        id,
        name,
        color,
      };
    }

    if (!normalized) {
      return acc;
    }

    let uniqueId = normalized.id;
    while (seenIds.has(uniqueId)) {
      uniqueId = generateTagId(uniqueId);
    }

    seenIds.add(uniqueId);
    acc.push({ ...normalized, id: uniqueId });
    return acc;
  }, []);
};

export const getTagTextColor = (color?: string): string => {
  const normalized = normalizeTagColor(color);
  const hex = normalized.slice(1);

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  return luminance > 186 ? "#111827" : "#ffffff";
};

