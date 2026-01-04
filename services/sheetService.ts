
import { SheetData } from '../types';

export class SheetService {
  static getCsvUrl(sheetUrl: string): string {
    try {
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!idMatch) return '';
      const id = idMatch[1];
      
      let url: URL;
      try {
        url = new URL(sheetUrl);
      } catch {
        return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
      }
      
      let gid = url.searchParams.get('gid');
      if (!gid) {
        const hashParams = new URLSearchParams(url.hash.replace('#', '?'));
        gid = hashParams.get('gid');
      }
      
      const baseUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq`;
      const params = new URLSearchParams({
        tqx: 'out:csv',
        gid: gid || '0'
      });
      
      return `${baseUrl}?${params.toString()}`;
    } catch (e) {
      return '';
    }
  }

  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let curVal = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    result.push(curVal.trim());
    return result;
  }

  static async fetchSheet(url: string): Promise<SheetData> {
    const csvUrl = this.getCsvUrl(url);
    if (!csvUrl) throw new Error("Invalid Spreadsheet URL.");

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("Failed to access sheet. Ensure it's public.");

    const text = await response.text();
    let allLines = text.split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => this.parseCsvLine(line));

    if (allLines.length === 0) throw new Error("Sheet is empty.");

    // FIND THE HEADER ROW:
    // Some sheets have a big title in row 1. We look for the first row that has 
    // at least 2 non-empty columns, or looks like it contains links.
    let headerIdx = 0;
    for (let i = 0; i < Math.min(allLines.length, 5); i++) {
      const nonEmpties = allLines[i].filter(cell => cell.length > 0).length;
      if (nonEmpties > 1) {
        headerIdx = i;
        break;
      }
    }

    const headers = allLines[headerIdx];
    const dataRows = allLines.slice(headerIdx + 1);

    const rows = dataRows.map(line => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        // Use column index as fallback key if header is empty
        const key = header || `Column_${index}`;
        row[key] = line[index] || '';
      });
      return row;
    });

    return { headers: headers.map((h, i) => h || `Column_${i}`), rows };
  }
}
