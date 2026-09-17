import type { RichDocument } from "./richProject";
import { parseRichProject, serializeRichProject } from "./richProject";
import { renumberRichRow, type RichRow } from "./richRows";
import { keys, record } from "./richValidation";

export type RichRowCommand =
  | { type: "insert-row"; row: RichRow; atIndex: number }
  | { type: "move-row"; rowId: string; toIndex: number }
  | { type: "update-row"; rowId: string; properties: Partial<Pick<RichRow, "name" | "description" | "role" | "titleStyle" | "numbering">> }
  | { type: "attach-row"; rowId: string; attachedTo: string | null }
  | { type: "renumber-row"; rowId: string }
  | { type: "delete-row"; rowId: string };

export function applyRichRowCommand(document: RichDocument, command: RichRowCommand): RichDocument {
  if (command.type === "insert-row") {
    if (!Number.isInteger(command.atIndex) || command.atIndex < 0 || command.atIndex > document.rows.length) throw new Error("Invalid row insertion index.");
    const rows = document.rows.map(entry => entry.position >= command.row.position ? { ...entry, position: entry.position + 1 } : entry);
    rows.splice(command.atIndex, 0, command.row);
    return parseRichProject(serializeRichProject({ ...document, rows, columnCount: Math.max(document.columnCount, command.row.cells.length) }));
  }
  const row = document.rows.find(entry => entry.id === command.rowId);
  if (!row) throw new Error(`Unknown row: ${command.rowId}.`);
  let candidate: RichDocument;
  if (command.type === "move-row") {
    if (!Number.isInteger(command.toIndex) || command.toIndex < 0 || command.toIndex >= document.rows.length) throw new Error("Invalid row destination.");
    const from = document.rows.indexOf(row);
    if (from === command.toIndex) return document;
    const rows = [...document.rows];
    rows.splice(from, 1);
    rows.splice(command.toIndex, 0, row);
    candidate = { ...document, rows: rows.map((entry, index) => ({ ...entry, position: document.rows[index].position })) };
  } else if (command.type === "delete-row") {
    const removed = new Set(document.objects.filter(object => object.rowId === row.id).map(object => object.id));
    const objectsById = new Map(document.objects.map(object => [object.id, object]));
    const survivingLink = (id: string | null, direction: "previousId" | "nextId"): string | null => {
      const visited = new Set<string>();
      while (id !== null && removed.has(id)) {
        if (visited.has(id)) return null;
        visited.add(id);
        id = objectsById.get(id)![direction];
      }
      return id;
    };
    candidate = { ...document,
      rows: document.rows.filter(entry => entry.id !== row.id).map(entry => ({ ...entry,
        position: entry.position > row.position ? entry.position - 1 : entry.position,
        attachedTo: entry.attachedTo === row.id ? null : entry.attachedTo,
      })),
      objects: document.objects.filter(object => !removed.has(object.id)).map(object => ({ ...object,
        previousId: survivingLink(object.previousId, "previousId"), nextId: survivingLink(object.nextId, "nextId"),
      })),
      analyses: document.analyses.map(analysis => ({ ...analysis,
        inputs: analysis.inputs.map(input => input.rowId === row.id ? { ...input, rowId: null } : input),
      })),
    };
  } else {
    let updated: RichRow;
    switch (command.type) {
      case "update-row":
        keys(record(command.properties, "properties"), ["name", "description", "role", "titleStyle", "numbering"], "properties");
        updated = { ...row, ...command.properties };
        break;
      case "attach-row":
        updated = { ...row, attachedTo: command.attachedTo };
        break;
      case "renumber-row":
        updated = renumberRichRow(row);
        break;
      default:
        throw new Error("Unknown row command.");
    }
    candidate = { ...document, rows: document.rows.map(entry => entry.id === row.id ? updated : entry) };
  }
  const saved = serializeRichProject(candidate);
  if (saved === serializeRichProject(document)) return document;
  // Own new property data, so later caller mutation cannot corrupt snapshots.
  return parseRichProject(saved);
}
