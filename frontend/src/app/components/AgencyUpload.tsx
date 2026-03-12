import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Globe,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:3000/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SourceTrack = 'internal' | 'external';
type FileType = 'csv' | 'json';
type UploadStep = 'idle' | 'preview' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadLog {
  id: string;
  fileName: string;
  uploadedAt: Date;
  status: 'success' | 'processing' | 'error';
  recordCount?: number;
  sourceTrack: SourceTrack;
  market: string;
}

interface FilePreview {
  file: File;
  fileType: FileType;
  content: string;
  /** For CSV: first 5 parsed rows (including header). For JSON: topic count. */
  csvRows?: string[][];
  jsonTopicCount?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const markets = [
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AUNZ', name: 'Australia & New Zealand' },
];

const CSV_TEMPLATE = `topicName,description,targetDemo,referenceLink,hashtags,audio,source
"K-Beauty Glass Skin Routine","Glass skin prep tutorials trending among Gen-Z beauty creators","Females 18-24","https://example.com/video1","#glassskin #kbeauty #skincare","Original Audio","TikTok"
"Street Food Mukbang","Korean street food eating challenges with ASMR audio","All 18-34","https://example.com/video2","#mukbang #streetfood #asmr","Street Eats OST","Instagram"
`;

const JSON_TEMPLATE = JSON.stringify(
  [
    {
      topicName: 'K-Beauty Glass Skin Routine',
      description:
        'Glass skin prep tutorials trending among Gen-Z beauty creators',
      targetDemo: 'Females 18-24',
      referenceLink: 'https://example.com/video1',
      hashtags: ['#glassskin', '#kbeauty', '#skincare'],
      audio: 'Original Audio',
      source: 'TikTok',
    },
    {
      topicName: 'Street Food Mukbang',
      description:
        'Korean street food eating challenges with ASMR audio',
      targetDemo: 'All 18-34',
      referenceLink: 'https://example.com/video2',
      hashtags: ['#mukbang', '#streetfood', '#asmr'],
      audio: 'Street Eats OST',
      source: 'Instagram',
    },
  ],
  null,
  2,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectFileType(fileName: string): FileType | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return 'csv';
  if (ext === 'json') return 'json';
  return null;
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current);
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(current);
        current = '';
        if (row.some((c) => c.trim() !== '')) rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }
  // last row
  row.push(current);
  if (row.some((c) => c.trim() !== '')) rows.push(row);

  return rows;
}

function countJsonTopics(text: string): number {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.length;
    if (typeof parsed === 'object' && parsed !== null) return 1;
  } catch {
    /* invalid json */
  }
  return 0;
}

function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function marketLabel(code: string): string {
  return markets.find((m) => m.code === code)?.name ?? code;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgencyUpload() {
  // Selectors
  const [selectedSource, setSelectedSource] = useState<SourceTrack>('internal');
  const [selectedMarket, setSelectedMarket] = useState('JP');

  // File / upload state
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // History
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([]);

  // Template preview
  const [showTemplate, setShowTemplate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Drag & drop handlers
  // -------------------------------------------------------------------------

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) readFile(files[0]);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        readFile(e.target.files[0]);
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Read file & build preview
  // -------------------------------------------------------------------------

  const readFile = (file: File) => {
    const ft = detectFileType(file.name);
    if (!ft) {
      setUploadError('Unsupported file type. Please upload a .json or .csv file.');
      setUploadStep('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const preview: FilePreview = { file, fileType: ft, content: text };

      if (ft === 'csv') {
        const rows = parseCSVRows(text);
        preview.csvRows = rows.slice(0, 6); // header + 5 data rows
      } else {
        preview.jsonTopicCount = countJsonTopics(text);
      }

      setFilePreview(preview);
      setUploadStep('preview');
      setUploadError(null);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file.');
      setUploadStep('error');
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------------------------
  // Confirm upload
  // -------------------------------------------------------------------------

  const confirmUpload = async () => {
    if (!filePreview) return;

    setUploadStep('uploading');
    setUploadError(null);

    const logEntry: UploadLog = {
      id: Date.now().toString() + Math.random(),
      fileName: filePreview.file.name,
      uploadedAt: new Date(),
      status: 'processing',
      sourceTrack: selectedSource,
      market: selectedMarket,
    };
    setUploadLogs((prev) => [logEntry, ...prev]);

    try {
      setUploadStep('processing');

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: filePreview.content,
          fileName: filePreview.file.name,
          fileType: filePreview.fileType,
          sourceTrack: selectedSource,
          market: selectedMarket,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Upload failed (${response.status})`);
      }

      const data = await response.json();

      setUploadLogs((prev) =>
        prev.map((l) =>
          l.id === logEntry.id
            ? { ...l, status: 'success' as const, recordCount: data.recordCount ?? data.count }
            : l,
        ),
      );
      setUploadStep('success');
    } catch (err: any) {
      setUploadLogs((prev) =>
        prev.map((l) =>
          l.id === logEntry.id ? { ...l, status: 'error' as const } : l,
        ),
      );
      setUploadError(err.message || 'Upload failed');
      setUploadStep('error');
    }
  };

  const resetUpload = () => {
    setFilePreview(null);
    setUploadStep('idle');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="px-6 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-card border border-border rounded-lg">
          <h3 className="text-foreground mb-2">Agency Upload Portal</h3>
          <p className="text-muted-foreground">
            Upload competitive intelligence and music trends data to feed the
            Shorts Intel Hub. Select the source track and market, then drop your
            file below.
          </p>
        </div>

        {/* ================================================================ */}
        {/* Source Track Selector                                            */}
        {/* ================================================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Source Track
          </label>
          <div className="flex gap-3">
            {/* Internal */}
            <button
              onClick={() => setSelectedSource('internal')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                selectedSource === 'internal'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-border bg-card text-muted-foreground hover:border-purple-500/40'
              }`}
            >
              <Database className="size-5" />
              Internal Source (Nyan Cat)
            </button>

            {/* External */}
            <button
              onClick={() => setSelectedSource('external')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                selectedSource === 'external'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-border bg-card text-muted-foreground hover:border-blue-500/40'
              }`}
            >
              <Globe className="size-5" />
              External Source (Vayner Media)
            </button>
          </div>

          {/* Track indicator */}
          <p className="mt-2 text-xs text-muted-foreground">
            Data will feed into the{' '}
            <span
              className={
                selectedSource === 'internal'
                  ? 'text-purple-400 font-semibold'
                  : 'text-blue-400 font-semibold'
              }
            >
              {selectedSource === 'internal'
                ? 'Internal (Nyan Cat)'
                : 'External (Vayner Media)'}
            </span>{' '}
            track of the three-track view.
          </p>
        </div>

        {/* ================================================================ */}
        {/* Market Selector                                                  */}
        {/* ================================================================ */}
        <div className="mb-6">
          <label
            htmlFor="market-select"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Market
          </label>
          <select
            id="market-select"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="w-full max-w-xs px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {markets.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
        </div>

        {/* ================================================================ */}
        {/* Template Section                                                 */}
        {/* ================================================================ */}
        <div className="mb-6 bg-card border border-border rounded-lg p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-foreground mb-2">
                Upload Templates &amp; Guidelines
              </h3>
              <p className="text-muted-foreground">
                Download a template to get started quickly
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  downloadBlob(
                    CSV_TEMPLATE,
                    'intel-hub-template.csv',
                    'text/csv',
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <FileSpreadsheet className="size-4" />
                CSV Template
              </button>
              <button
                onClick={() =>
                  downloadBlob(
                    JSON_TEMPLATE,
                    'intel-hub-template.json',
                    'application/json',
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors"
              >
                <FileText className="size-4" />
                JSON Template
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <Eye className="size-4" />
            {showTemplate ? 'Hide' : 'Show'} Template Preview
          </button>

          {showTemplate && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  CSV Format
                </h4>
                <div className="p-3 bg-muted rounded-lg overflow-auto max-h-60">
                  <pre className="text-xs text-foreground whitespace-pre-wrap">
                    {CSV_TEMPLATE}
                  </pre>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  JSON Format
                </h4>
                <div className="p-3 bg-muted rounded-lg overflow-auto max-h-60">
                  <pre className="text-xs text-foreground whitespace-pre-wrap">
                    {JSON_TEMPLATE}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* Upload Area                                                      */}
        {/* ================================================================ */}
        {uploadStep === 'idle' || uploadStep === 'error' ? (
          <>
            <div
              className={`mb-4 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-foreground mb-2">Drag &amp; Drop Files Here</h3>
              <p className="text-muted-foreground mb-4">
                Supported formats: JSON, CSV
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
            {uploadStep === 'error' && uploadError && (
              <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="size-4 flex-shrink-0" />
                {uploadError}
                <button
                  onClick={resetUpload}
                  className="ml-auto text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </>
        ) : uploadStep === 'preview' && filePreview ? (
          /* ---- File Preview ---- */
          <div className="mb-6 bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {filePreview.fileType === 'csv' ? (
                  <FileSpreadsheet className="size-6 text-green-400" />
                ) : (
                  <FileText className="size-6 text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {filePreview.file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {filePreview.fileType.toUpperCase()} &middot;{' '}
                    {(filePreview.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={resetUpload}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            {/* CSV preview table */}
            {filePreview.fileType === 'csv' && filePreview.csvRows && (
              <div className="mb-4 overflow-x-auto">
                <p className="text-sm text-muted-foreground mb-2">
                  Preview (first {Math.max(0, (filePreview.csvRows.length ?? 1) - 1)}{' '}
                  data rows):
                </p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {filePreview.csvRows[0]?.map((h, i) => (
                        <th
                          key={i}
                          className="text-left px-2 py-1 border-b border-border text-muted-foreground font-semibold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filePreview.csvRows.slice(1).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-2 py-1 border-b border-border/50 text-foreground max-w-[200px] truncate"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* JSON preview */}
            {filePreview.fileType === 'json' && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-foreground">
                  Found{' '}
                  <span className="font-bold">
                    {filePreview.jsonTopicCount}
                  </span>{' '}
                  topic{filePreview.jsonTopicCount !== 1 ? 's' : ''} in this
                  file.
                </p>
              </div>
            )}

            {/* Destination summary */}
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Uploading to:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedSource === 'internal'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {selectedSource === 'internal' ? 'Internal' : 'External'}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted-foreground/20 text-foreground border border-border"
              >
                {marketLabel(selectedMarket)}
              </span>
            </div>

            <button
              onClick={confirmUpload}
              className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              Confirm Upload
            </button>
          </div>
        ) : (
          /* ---- Upload in progress / success ---- */
          <div className="mb-6 bg-card border border-border rounded-lg p-8 text-center">
            {(uploadStep === 'uploading' || uploadStep === 'processing') && (
              <>
                <Clock className="size-10 mx-auto mb-3 text-blue-400 animate-pulse" />
                <p className="text-foreground font-medium mb-1">
                  {uploadStep === 'uploading'
                    ? 'Uploading file...'
                    : 'Processing data...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filePreview?.file.name}
                </p>
              </>
            )}
            {uploadStep === 'success' && (
              <>
                <CheckCircle2 className="size-10 mx-auto mb-3 text-green-500" />
                <p className="text-foreground font-medium mb-1">
                  Upload Successful
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {filePreview?.file.name} has been processed.
                </p>
                <button
                  onClick={resetUpload}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Upload Another File
                </button>
              </>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* Upload History                                                   */}
        {/* ================================================================ */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Upload History (This Session)</h3>
            <span className="text-sm text-muted-foreground">
              {uploadLogs.length} upload{uploadLogs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {uploadLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No uploads yet this session
            </div>
          ) : (
            <div className="space-y-3">
              {uploadLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {log.status === 'success' && (
                      <CheckCircle2 className="size-6 text-green-500" />
                    )}
                    {log.status === 'processing' && (
                      <Clock className="size-6 text-blue-400 animate-pulse" />
                    )}
                    {log.status === 'error' && (
                      <AlertCircle className="size-6 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {log.fileName}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {/* Source track badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          log.sourceTrack === 'internal'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {log.sourceTrack === 'internal'
                          ? 'Internal'
                          : 'External'}
                      </span>
                      {/* Market badge */}
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted-foreground/20 text-foreground border border-border">
                        {marketLabel(log.market)}
                      </span>
                      {log.recordCount != null && (
                        <span className="text-muted-foreground">
                          {log.recordCount} records
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {log.uploadedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {log.status === 'success' && (
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm border border-green-500/30">
                        Success
                      </span>
                    )}
                    {log.status === 'processing' && (
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm border border-blue-500/30">
                        Processing...
                      </span>
                    )}
                    {log.status === 'error' && (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm border border-red-500/30">
                        Error
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-foreground mb-2">Need Help?</h4>
          <p className="text-muted-foreground text-sm">
            For questions about data format, submission guidelines, or technical
            issues, contact the APAC Shorts Intel Hub team at{' '}
            <span className="text-primary">shorts-intel@example.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
