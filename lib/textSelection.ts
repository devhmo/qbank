// Converts the current window selection into character offsets relative to
// `container`'s plain-text content. Returns null if there's no usable
// (non-collapsed) selection inside the container — e.g. a plain click, or a
// selection that started outside the stem.
export function getSelectionOffsets(
  container: HTMLElement
): { start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const preRange = document.createRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;
  const end = start + range.toString().length;

  if (end <= start) return null;

  return { start, end };
}
