/** Check whether lexical JSON contains any meaningful content (text, images, etc.) */
export const lexicalHasContent = (value: string): boolean => {
  if (!value) return false;

  try {
    const data = JSON.parse(value);
    if (!data || typeof data !== "object") return !!value.trim();

    let found = false;
    const walk = (node: unknown) => {
      if (found || !node || typeof node !== "object") return;
      const record = node as { type?: unknown; text?: unknown; children?: unknown };
      // text node with actual content
      if (typeof record.text === "string" && record.text.trim()) {
        found = true;
        return;
      }
      // non-text leaf nodes (image, horizontal-rule, etc.)
      if (typeof record.type === "string" && ["image", "horizontal-rule", "callout"].includes(record.type)) {
        found = true;
        return;
      }
      if (Array.isArray(record.children)) {
        record.children.forEach(walk);
      }
    };

    walk(data.root);
    return found;
  } catch {
    return !!value.trim();
  }
};

export const lexicalJsonToPlainText = (value: string) => {
  if (!value) return "";

  try {
    const data = JSON.parse(value);
    if (!data || typeof data !== "object") return value.trim();

    const texts: string[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const record = node as { text?: unknown; children?: unknown };
      if (typeof record.text === "string") {
        texts.push(record.text);
      }
      if (Array.isArray(record.children)) {
        record.children.forEach(walk);
      }
    };

    walk(data.root);
    return texts.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return value.replace(/\s+/g, " ").trim();
  }
};
