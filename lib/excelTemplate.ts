import ExcelJS from "exceljs";
import type { ExcelRow } from "@/lib/parseExcelRows";

const TEMPLATE_COLUMNS = [
  { header: "Question", key: "Question", width: 50 },
  { header: "Choice1", key: "Choice1", width: 25 },
  { header: "Choice2", key: "Choice2", width: 25 },
  { header: "Choice3", key: "Choice3", width: 25 },
  { header: "Choice4", key: "Choice4", width: 25 },
  { header: "Choice5", key: "Choice5", width: 25 },
  { header: "CorrectAnswer", key: "CorrectAnswer", width: 15 },
  { header: "Explanation1", key: "Explanation1", width: 30 },
  { header: "Explanation2", key: "Explanation2", width: 30 },
  { header: "Explanation3", key: "Explanation3", width: 30 },
  { header: "Explanation4", key: "Explanation4", width: 30 },
  { header: "Explanation5", key: "Explanation5", width: 30 },
  { header: "Subject", key: "Subject", width: 20 },
  { header: "System", key: "System", width: 20 },
  { header: "Topic", key: "Topic", width: 20 },
  { header: "Difficulty", key: "Difficulty", width: 12 },
  { header: "HighYield", key: "HighYield", width: 12 },
  { header: "Source", key: "Source", width: 25 },
];

const INSTRUCTIONS = [
  "How to fill out this template",
  "",
  "One row = one question.",
  "Question: the full question stem.",
  "Choice1-Choice5: answer choices. Leave unused ones blank (2-5 choices allowed).",
  'CorrectAnswer: the number(s) of the correct choice(s), matching Choice1-Choice5. Example: "1", or "1,3" for multiple correct choices.',
  "Explanation1-Explanation5: optional, per-choice explanation matching each ChoiceN column.",
  "Subject / System / Topic: must exactly match (case-insensitive) an existing entry in your QBank catalog (Admin > Catalog). Rows that don't match can be fixed in the import preview before saving.",
  "Difficulty: easy, medium, or hard. Defaults to medium if left blank or unrecognized.",
  "HighYield: TRUE or FALSE. Defaults to FALSE if left blank.",
  "Source: optional reference text.",
  "",
  "All imported questions are saved as drafts - review and publish them from the Questions list.",
];

export async function downloadImportTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QBank";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Questions");
  sheet.columns = TEMPLATE_COLUMNS;
  sheet.getRow(1).font = { bold: true };

  sheet.addRow({
    Question:
      "Which hormone is primarily responsible for regulating plasma osmolality?",
    Choice1: "Antidiuretic hormone (ADH)",
    Choice2: "Aldosterone",
    Choice3: "Atrial natriuretic peptide",
    Choice4: "",
    Choice5: "",
    CorrectAnswer: "1",
    Explanation1:
      "Correct - ADH is released in response to increased plasma osmolality.",
    Explanation2:
      "Incorrect - aldosterone primarily regulates sodium and volume.",
    Explanation3:
      "Incorrect - ANP responds to volume expansion, not osmolality.",
    Explanation4: "",
    Explanation5: "",
    Subject: "Physiology",
    System: "Renal",
    Topic: "Osmoregulation",
    Difficulty: "medium",
    HighYield: "TRUE",
    Source: "Guyton & Hall, Ch. 29",
  });

  const instructions = workbook.addWorksheet("Instructions");
  instructions.columns = [{ width: 100 }];
  INSTRUCTIONS.forEach((line, index) => {
    const row = instructions.getRow(index + 1);
    row.getCell(1).value = line;
    if (index === 0) row.font = { bold: true, size: 13 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "qbank-import-template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function cellValue(value: ExcelJS.CellValue): string | number | boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") {
    if ("richText" in value) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value) {
      return String((value as { text: unknown }).text);
    }
    if ("result" in value) {
      return (value as { result?: string | number | boolean }).result;
    }
    return undefined;
  }
  return value as string | number | boolean;
}

export async function readExcelFile(file: File): Promise<ExcelRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet =
    workbook.getWorksheet("Questions") ?? workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (c, colNumber) => {
    headers[colNumber] = String(cellValue(c.value) ?? "").trim();
  });

  const rows: ExcelRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: ExcelRow = {};
    row.eachCell({ includeEmpty: false }, (c, colNumber) => {
      const key = headers[colNumber];
      if (!key) return;
      record[key] = cellValue(c.value);
    });
    if (Object.keys(record).length > 0) rows.push(record);
  });

  return rows;
}
