#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import posixpath
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WORKBOOK = Path("/Users/jaredlambert/Desktop/rate-percentiles-by-payer-family.xlsx")
OUTPUT_DIR = ROOT / "health-data"
OUTPUT_WORKBOOK_NAME = "rate-percentiles-by-payer-family.xlsx"
OUTPUT_JSON_NAME = "workbook-data.json"

NS_MAIN = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
NS_PACKAGE_REL = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}


def col_index(cell_ref: str) -> int:
    match = re.match(r"([A-Z]+)", cell_ref)
    if not match:
        return 0

    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - ord("A") + 1
    return value - 1


def text_content(node: ET.Element | None) -> str:
    if node is None:
        return ""
    return "".join(node.itertext())


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        raw = zf.read("xl/sharedStrings.xml")
    except KeyError:
        return []

    root = ET.fromstring(raw)
    return [text_content(si) for si in root.findall("m:si", NS_MAIN)]


def load_sheet_paths(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("rel:Relationship", NS_PACKAGE_REL)
    }

    sheets: list[tuple[str, str]] = []
    for sheet in workbook.findall("m:sheets/m:sheet", NS_MAIN):
        name = sheet.attrib["name"]
        rel_id = sheet.attrib[f"{{{NS_REL['r']}}}id"]
        target = rel_targets[rel_id]
        path = posixpath.normpath(target if target.startswith("xl/") else f"xl/{target}")
        sheets.append((name, path))

    return sheets


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str | int | float | bool | None:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("m:v", NS_MAIN)

    if cell_type == "inlineStr":
        return text_content(cell.find("m:is", NS_MAIN))
    if value_node is None:
        return None

    raw = value_node.text or ""
    if cell_type == "s":
        index = int(raw)
        return shared_strings[index] if index < len(shared_strings) else ""
    if cell_type == "b":
        return raw == "1"
    if cell_type == "str":
        return raw

    try:
        numeric = float(raw)
    except ValueError:
        return raw

    if numeric.is_integer():
        return int(numeric)
    return numeric


def trim_row(row: list[str | int | float | bool | None]) -> list[str | int | float | bool | None]:
    while row and row[-1] is None:
        row.pop()
    return row


def parse_sheet(
    zf: zipfile.ZipFile, sheet_name: str, sheet_path: str, shared_strings: list[str]
) -> dict[str, object]:
    root = ET.fromstring(zf.read(sheet_path))
    rows: list[list[str | int | float | bool | None]] = []
    max_cols = 0

    for row_node in root.findall("m:sheetData/m:row", NS_MAIN):
        row: list[str | int | float | bool | None] = []
        for cell in row_node.findall("m:c", NS_MAIN):
            idx = col_index(cell.attrib.get("r", "A1"))
            while len(row) <= idx:
                row.append(None)
            row[idx] = cell_value(cell, shared_strings)

        trimmed = trim_row(row)
        rows.append(trimmed)
        max_cols = max(max_cols, len(trimmed))

    while rows and not rows[-1]:
        rows.pop()

    return {
        "name": sheet_name,
        "rowCount": len(rows),
        "columnCount": max_cols,
        "rows": rows,
    }


def build(source: Path, output_dir: Path) -> Path:
    if not source.exists():
        raise SystemExit(f"Workbook not found: {source}")

    output_dir.mkdir(parents=True, exist_ok=True)
    workbook_output = output_dir / OUTPUT_WORKBOOK_NAME
    shutil.copy2(source, workbook_output)

    with zipfile.ZipFile(source) as zf:
        shared_strings = load_shared_strings(zf)
        sheets = [
            parse_sheet(zf, sheet_name, sheet_path, shared_strings)
            for sheet_name, sheet_path in load_sheet_paths(zf)
        ]

    payload = {
        "sourceWorkbook": OUTPUT_WORKBOOK_NAME,
        "sourceWorkbookBytes": source.stat().st_size,
        "sourceModifiedAt": datetime.fromtimestamp(source.stat().st_mtime, timezone.utc).isoformat(),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sheets": sheets,
    }

    output_json = output_dir / OUTPUT_JSON_NAME
    output_json.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return output_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Build health-data static assets from the summary workbook.")
    parser.add_argument("--source", type=Path, default=DEFAULT_WORKBOOK)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    args = parser.parse_args()

    output_json = build(args.source.expanduser(), args.output_dir)
    print(output_json)


if __name__ == "__main__":
    main()
