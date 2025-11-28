import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { uploadDocument } from "@/lib/upload";

export interface UploadedDocument {
  filename: string;
  fileUrl: string;
  documentType: "drawing" | "specification" | "addendum";
  fileSize?: number;
  mimeType?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

interface DocumentUploadProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

export default function DocumentUpload({ documents, onDocumentsChange, onUploadStateChange, disabled }: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [dragCounter, setDragCounter] = useState(0);
  const { toast } = useToast();
  
  const isDragging = dragCounter > 0;
  const isUploading = uploadingFiles.size > 0;

  // Notify parent component when upload state changes
  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const newUploadingFiles = new Map(uploadingFiles);

    // Initialize upload tracking for each file
    filesArray.forEach(file => {
      const fileId = `${file.name}-${Date.now()}-${Math.random()}`;
      newUploadingFiles.set(fileId, {
        file,
        progress: 0,
        status: 'uploading',
      });
    });

    setUploadingFiles(newUploadingFiles);

    // Upload files individually with progress tracking
    const uploadResults = await Promise.allSettled(
      filesArray.map(async (file) => {
        const fileId = Array.from(newUploadingFiles.entries())
          .find(([_, data]) => data.file === file)?.[0];
        
        if (!fileId) return null;

        try {
          const fileUrl = await uploadDocument(file, (progress) => {
            setUploadingFiles(prev => {
              const updated = new Map(prev);
              const fileData = updated.get(fileId);
              if (fileData) {
                updated.set(fileId, {
                  ...fileData,
                  progress: progress.percentage,
                });
              }
              return updated;
            });
          });

          // Mark as complete
          setUploadingFiles(prev => {
            const updated = new Map(prev);
            const fileData = updated.get(fileId);
            if (fileData) {
              updated.set(fileId, {
                ...fileData,
                progress: 100,
                status: 'complete',
              });
            }
            return updated;
          });

          return {
            filename: file.name,
            fileUrl,
            documentType: "specification" as const,
            fileSize: file.size,
            mimeType: file.type,
          };
        } catch (error) {
          // Mark as error
          setUploadingFiles(prev => {
            const updated = new Map(prev);
            const fileData = updated.get(fileId);
            if (fileData) {
              updated.set(fileId, {
                ...fileData,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              });
            }
            return updated;
          });
          throw error;
        }
      })
    );

    // Process results
    const successfulUploads = uploadResults
      .filter((result): result is PromiseFulfilledResult<UploadedDocument | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);

    const failedUploads = uploadResults.filter(result => result.status === 'rejected');

    if (successfulUploads.length > 0) {
      onDocumentsChange([...documents, ...successfulUploads]);
      toast({
        title: "Success",
        description: `${successfulUploads.length} document${successfulUploads.length > 1 ? 's' : ''} uploaded successfully`,
      });
    }

    if (failedUploads.length > 0) {
      toast({
        title: "Some uploads failed",
        description: `${failedUploads.length} file${failedUploads.length > 1 ? 's' : ''} failed to upload`,
        variant: "destructive",
      });
    }

    // Clear completed/failed uploads after a delay
    setTimeout(() => {
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        Array.from(updated.entries()).forEach(([id, data]) => {
          if (data.status === 'complete' || data.status === 'error') {
            updated.delete(id);
          }
        });
        return updated;
      });
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await uploadFiles(files);
      e.target.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setDragCounter(prev => prev + 1);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setDragCounter(prev => Math.max(0, prev - 1));
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    await uploadFiles(files);
  };

  const removeDocument = (index: number) => {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  };

  const updateDocumentType = (index: number, type: "drawing" | "specification" | "addendum") => {
    const updated = [...documents];
    updated[index].documentType = type;
    onDocumentsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        data-testid="dropzone-document-upload"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm font-medium text-center">
            {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
          </p>
          <input
            id="document-upload"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileUpload}
            className="hidden"
            disabled={disabled || isUploading}
            data-testid="input-document-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('document-upload')?.click()}
            disabled={disabled || isUploading}
            data-testid="button-upload-document"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Text files (.txt) - Max 350MB per file
          </p>
        </div>
      </div>

      {/* Show upload progress */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading...</h4>
          {Array.from(uploadingFiles.entries()).map(([id, fileData]) => (
            <div
              key={id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              data-testid={`uploading-file-${id}`}
            >
              {fileData.status === 'uploading' && (
                <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
              )}
              {fileData.status === 'complete' && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              {fileData.status === 'error' && (
                <X className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileData.file.name}
                </p>
                {fileData.status === 'uploading' && (
                  <div className="mt-1 space-y-1">
                    <Progress value={fileData.progress} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      {fileData.progress}% ({(fileData.file.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
                {fileData.status === 'complete' && (
                  <p className="text-xs text-green-600">Upload complete!</p>
                )}
                {fileData.status === 'error' && (
                  <p className="text-xs text-destructive">{fileData.error || 'Upload failed'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Documents</h4>
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              data-testid={`document-item-${index}`}
            >
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid={`text-filename-${index}`}>
                  {doc.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                </p>
              </div>
              <Select
                value={doc.documentType}
                onValueChange={(value) => updateDocumentType(index, value as "drawing" | "specification" | "addendum")}
                disabled={disabled}
              >
                <SelectTrigger className="w-[150px]" data-testid={`select-document-type-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drawing">Drawing</SelectItem>
                  <SelectItem value="specification">Specification</SelectItem>
                  <SelectItem value="addendum">Addendum</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(index)}
                disabled={disabled}
                data-testid={`button-remove-document-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
