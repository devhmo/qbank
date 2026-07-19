"use client";

import { useState } from "react";
import { parseStructuredText } from "@/lib/parseStructuredText";
import { parseExcelRows } from "@/lib/parseExcelRows";
import { downloadImportTemplate, readExcelFile } from "@/lib/excelTemplate";
import ImportPreviewList from "@/components/admin/ImportPreviewList";
import type { CatalogLookup, ParsedQuestion } from "@/types/models";

const EXAMPLE_TEXT = `Q: Which hormone is primarily responsible for regulating plasma osmolality?
SUBJECT: Physiology
SYSTEM: Renal
TOPIC: Osmoregulation
DIFFICULTY: medium
HIGH_YIELD: true
SOURCE: Guyton & Hall, Ch. 29

A) Antidiuretic hormone (ADH) *
EXPLANATION: Correct — ADH is released in response to increased plasma osmolality.
B) Aldosterone
EXPLANATION: Incorrect — aldosterone primarily regulates sodium and volume.
C) Atrial natriuretic peptide
EXPLANATION: Incorrect — ANP responds to volume expansion, not osmolality.

---

Q: Which structure directly senses changes in plasma osmolality?
SUBJECT: Physiology
SYSTEM: Renal
TOPIC: Osmoregulation
DIFFICULTY: easy

A) Osmoreceptors in the hypothalamus *
B) Baroreceptors in the carotid sinus
C) Juxtaglomerular cells`;

const fileInputClasses =
  "mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100";

export default function ImportManager({ catalog }: { catalog: CatalogLookup }) {
  const [method, setMethod] = useState<"text" | "excel">("text");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestion[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  function handleParseText() {
    if (!text.trim()) {
      setParseError("Paste or upload some text first.");
      return;
    }
    const results = parseStructuredText(text, catalog);
    if (results.length === 0) {
      setParseError("No questions found. Check the format against the example above.");
      return;
    }
    setParseError(null);
    setParsed(results);
    setSessionKey((k) => k + 1);
  }

  async function handleTextFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    setParseError(null);
  }

  async function handleExcelFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseError(null);

    try {
      const rows = await readExcelFile(file);
      const results = parseExcelRows(rows, catalog);
      if (results.length === 0) {
        setParseError(
          "No questions found in that file. Make sure you're using the downloaded template and the Question column is filled in."
        );
      } else {
        setParsed(results);
        setSessionKey((k) => k + 1);
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Couldn't read that file."
      );
    }

    setParsing(false);
    e.target.value = "";
  }

  function handleStartOver() {
    setParsed(null);
    setText("");
    setParseError(null);
  }

  if (parsed) {
    return (
      <ImportPreviewList
        key={sessionKey}
        initialQuestions={parsed}
        catalog={catalog}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <div>
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700">
        {(
          [
            { id: "text", label: "Structured Text" },
            { id: "excel", label: "Excel" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMethod(tab.id);
              setParseError(null);
            }}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
              method === tab.id
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {method === "text" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200">Format</p>
            <p className="mt-1">
              Each question starts with <code>Q:</code> followed by the stem
              (multiple paragraphs are fine), then <code>SUBJECT:</code>,{" "}
              <code>SYSTEM:</code>, and <code>TOPIC:</code> — these must
              match your catalog exactly (not case-sensitive). Then list
              choices as <code>A)</code>, <code>B)</code>, etc., adding{" "}
              <code>*</code> at the end of a choice&rsquo;s line to mark it
              correct. An optional <code>EXPLANATION:</code> line under a
              choice explains that choice. Separate questions with a line
              containing only <code>---</code>.
            </p>
            <p className="mt-2">
              Optional fields: <code>DIFFICULTY:</code> (easy/medium/hard,
              defaults to medium), <code>HIGH_YIELD:</code> (true/false,
              defaults to false), <code>SOURCE:</code>.
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer font-medium text-primary-700 dark:text-primary-400">
                Show example
              </summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {EXAMPLE_TEXT}
              </pre>
            </details>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Paste your text, or upload a .txt / .md file
            </label>
            <textarea
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:text-slate-100"
              placeholder={EXAMPLE_TEXT}
            />
            <input
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleTextFileUpload}
              className={fileInputClasses}
            />
          </div>

          {parseError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {parseError}
            </p>
          )}

          <button
            type="button"
            onClick={handleParseText}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Parse & Preview
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200">Format</p>
            <p className="mt-1">
              Download the template, fill in one row per question (up to 5
              choices), and set <code>Correct Answer</code> to the number of
              the correct choice — e.g. <code>1</code>, or{" "}
              <code>1,3</code> for multiple correct choices. Subject / System
              / Topic must match your catalog exactly (not case-sensitive).
              Full instructions are on the template&rsquo;s second sheet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadImportTemplate()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Download .xlsx Template
          </button>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Upload your filled-in template
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleExcelFileUpload}
              disabled={parsing}
              className={fileInputClasses}
            />
          </div>

          {parsing && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Reading file...</p>
          )}
          {parseError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {parseError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
