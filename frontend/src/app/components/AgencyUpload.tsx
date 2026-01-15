import { useState, useRef } from 'react';
import { Upload, FileText, Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadLog {
  id: string;
  fileName: string;
  uploadedAt: Date;
  status: 'success' | 'processing' | 'error';
  recordCount?: number;
  source: string;
}

const templateMarkdown = `# Shorts Intel Hub - Data Upload Template

## Competitive Intel (Agency) Format

Please provide trending topics from TikTok and Instagram in the following format:

\`\`\`json
{
  "topicName": "Your Topic Name",
  "description": "Why is this trending? What is the content about? Be specific.",
  "targetDemo": "e.g., Females 18-24, Males 25-34, All 18-34",
  "referenceLink": "URL to representative video",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "audio": "Song or audio name (optional)",
  "source": "TikTok" or "Instagram"
}
\`\`\`

## Music Partnership Format

For artist and song submissions:

\`\`\`json
{
  "topicName": "Artist Name - Song Title",
  "description": "Context about why this song is trending or relevant for campaigns",
  "targetDemo": "Target audience for this music",
  "referenceLink": "YouTube Music link or example video",
  "audio": "Song Title - Artist Name",
  "hashtags": ["#music", "#relevant", "#tags"]
}
\`\`\`

## Batch Upload Format

For multiple entries, use JSON array:

\`\`\`json
[
  {
    "topicName": "Topic 1",
    "description": "Description...",
    ...
  },
  {
    "topicName": "Topic 2",
    "description": "Description...",
    ...
  }
]
\`\`\`

## Required Fields

- **topicName** (mandatory): Clear, concise headline
- **description** (mandatory): Detailed context about the trend
- **targetDemo** (mandatory): Specific audience segment
- **referenceLink** (mandatory): URL to representative content

## Optional Fields

- **hashtags**: Array of relevant hashtags
- **audio**: Specific song or audio track name
- **source**: Where this trend originated

## Tips for Quality Submissions

1. **Be Specific**: "K-Beauty Glass Skin Routine" is better than "Beauty Trend"
2. **Provide Context**: Explain WHY it's trending, not just WHAT it is
3. **Target Precisely**: Use specific demo segments when possible
4. **Fresh Content**: Focus on trends from the past 1-2 weeks
5. **Quality Over Quantity**: 5 well-researched trends beat 20 generic ones

## Questions?

Contact the APAC Shorts Intel Hub team for assistance.
`;

export function AgencyUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([
    {
      id: '1',
      fileName: 'competitive-intel-week2.json',
      uploadedAt: new Date(2026, 0, 12, 14, 30),
      status: 'success',
      recordCount: 15,
      source: 'Agency - TikTok/Instagram',
    },
    {
      id: '2',
      fileName: 'music-trends-january.json',
      uploadedAt: new Date(2026, 0, 10, 9, 15),
      status: 'success',
      recordCount: 8,
      source: 'Music Partnership',
    },
    {
      id: '3',
      fileName: 'weekly-trends-kr.json',
      uploadedAt: new Date(2026, 0, 6, 16, 45),
      status: 'success',
      recordCount: 12,
      source: 'Agency - Korea',
    },
  ]);
  const [showTemplate, setShowTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      // Simulate file processing
      const newLog: UploadLog = {
        id: Date.now().toString() + Math.random(),
        fileName: file.name,
        uploadedAt: new Date(),
        status: 'processing',
        source: 'Manual Upload',
      };

      setUploadLogs((prev) => [newLog, ...prev]);

      // Simulate processing
      setTimeout(() => {
        setUploadLogs((prev) =>
          prev.map((log) =>
            log.id === newLog.id
              ? { ...log, status: 'success', recordCount: Math.floor(Math.random() * 20) + 5 }
              : log
          )
        );
      }, 2000);
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intel-hub-upload-template.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-card border border-border rounded-lg">
          <h3 className="text-foreground mb-2">Agency Upload Portal</h3>
          <p className="text-muted-foreground">
            Upload competitive intelligence and music trends data to feed the Shorts Intel Hub. 
            No login required - this portal is accessible for external agency partners.
          </p>
        </div>

        {/* Template Section */}
        <div className="mb-6 bg-card border border-border rounded-lg p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-foreground mb-2">Upload Template & Guidelines</h3>
              <p className="text-muted-foreground">
                Download the template to understand the required format for data submissions
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" />
              Download Template
            </button>
          </div>

          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="text-primary hover:underline"
          >
            {showTemplate ? 'Hide' : 'Show'} Template Preview
          </button>

          {showTemplate && (
            <div className="mt-4 p-4 bg-muted rounded-lg overflow-auto max-h-96">
              <pre className="text-sm text-foreground whitespace-pre-wrap">{templateMarkdown}</pre>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`mb-6 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
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
          <h3 className="text-foreground mb-2">Drag & Drop Files Here</h3>
          <p className="text-muted-foreground mb-4">
            Supported formats: JSON, CSV, TXT
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
            multiple
            accept=".json,.csv,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Upload History */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Upload History (This Week Only)</h3>
            <span className="text-sm text-muted-foreground">Week of Jan 13-19, 2026</span>
          </div>

          {uploadLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No uploads yet
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
                      <CheckCircle2 className="size-6 text-green-600" />
                    )}
                    {log.status === 'processing' && (
                      <Clock className="size-6 text-blue-600 animate-pulse" />
                    )}
                    {log.status === 'error' && (
                      <AlertCircle className="size-6 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{log.fileName}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{log.source}</span>
                      {log.recordCount && (
                        <span>• {log.recordCount} records processed</span>
                      )}
                      <span>
                        • {log.uploadedAt.toLocaleDateString()} at{' '}
                        {log.uploadedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {log.status === 'success' && (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                        Success
                      </span>
                    )}
                    {log.status === 'processing' && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                        Processing...
                      </span>
                    )}
                    {log.status === 'error' && (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">
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
            For questions about data format, submission guidelines, or technical issues, 
            contact the APAC Shorts Intel Hub team at <span className="text-primary">shorts-intel@example.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}