
export interface AmazonProduct {
  id: string;
  url: string;
  palette?: string;
  title?: string;
  extractedImages: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
}

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
}
