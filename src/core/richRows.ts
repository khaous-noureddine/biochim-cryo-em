/** Version-2 row primitives. The application still uses the version-1 model. */
export type RichTextStyle = {
  foreground?: string;
  background?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontSlant?: string;
  fontWidth?: string;
  anchor?: string;
};

export type RichCell = {
  text: string;
  /** Missing and null preserve distinct historical numbering states. */
  number?: number | null;
  style?: RichTextStyle;
  /** Original coordinate identity is independent of the displayed number. */
  residueIdentity?: {
    model: string;
    authorChain: string;
    labelChain: string;
    authorNumber: string;
    insertionCode: string;
  };
};

export type RichRow = {
  id: string;
  kind: "sequence" | "annotation";
  name: string;
  description: string;
  /** Preserve annotation role separately from its editable display name. */
  role?: string;
  position: number;
  cells: RichCell[];
  numbering: { mode: "automatic"; start: number } | { mode: "fixed" };
  attachedTo: string | null;
  titleStyle?: RichTextStyle;
};

/** Matches ALINE _FillSeqnum: only these complete cell texts are gaps. */
export function isNumberingGap(text: string): boolean {
  return text === "" || text === "-" || text === "." || text === "_" || text === " ";
}

/** Recalculation is an explicit immutable operation, never an import side effect. */
export function renumberRichRow(row: RichRow): RichRow {
  if (row.numbering.mode === "fixed") return row;
  let next = row.numbering.start;
  if (!Number.isFinite(next)) throw new Error("Automatic numbering start must be finite.");
  const cells = row.cells.map((cell) => {
    if (isNumberingGap(cell.text)) return { ...cell, number: null };
    const number = next;
    next += 1;
    if (!Number.isFinite(next) || next === number) {
      throw new Error("Automatic numbering exceeds numeric precision.");
    }
    return { ...cell, number };
  });
  return { ...row, cells };
}

/** ALINE _AttachmentForX follows links in both directions, even through cycles. */
export function richAttachmentGroup(rows: readonly RichRow[], rowId: string, excludeSelf = false): string[] {
  const neighbors = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.id || neighbors.has(row.id)) throw new Error("Row identifiers must be nonempty and unique.");
    neighbors.set(row.id, new Set());
  }
  if (!neighbors.has(rowId)) throw new Error(`Unknown row: ${rowId}.`);
  for (const row of rows) {
    if (row.attachedTo === null) continue;
    const target = neighbors.get(row.attachedTo);
    if (!target) throw new Error(`Unknown attachment target: ${row.attachedTo}.`);
    neighbors.get(row.id)!.add(row.attachedTo);
    target.add(row.id);
  }
  const visited = new Set([rowId]);
  const pending = [rowId];
  for (let index = 0; index < pending.length; index += 1) {
    for (const id of neighbors.get(pending[index])!) {
      if (!visited.has(id)) {
        visited.add(id);
        pending.push(id);
      }
    }
  }
  // Stable document order replaces historical Perl hash iteration order.
  return rows.filter((row) => visited.has(row.id) && !(excludeSelf && row.id === rowId)).map((row) => row.id);
}
