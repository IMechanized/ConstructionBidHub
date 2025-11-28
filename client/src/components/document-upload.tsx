import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface UploadedDocument {
  filename: string;
  fileUrl: string;
  documentType: "drawing" | "specification" | "addendum";
  fileSize?: number;
  mimeType?: string;
}

interface DocumentUploadProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  disabled?: boolean;
}

export default function DocumentUpload({ documents, onDocumentsChange, disabled }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const { toast } = useToast();
  
  const isDragging = dragCounter > 0;

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          let errorMessage = 'Failed to upload document';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If response is not JSON (e.g., HTML error page), use the status text
            errorMessage = `Upload failed: ${response.statusText || response.status}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return {
          filename: data.filename,
          fileUrl: data.url, // Map 'url' from upload response to 'fileUrl' for save endpoint
          documentType: "specification" as const,
          fileSize: data.size,
          mimeType: data.mimeType,
        };
      });

      const uploadedDocs = await Promise.all(uploadPromises);
      onDocumentsChange([...documents, ...uploadedDocs]);

      toast({
        title: "Success",
        description: `${uploadedDocs.length} document${uploadedDocs.length > 1 ? 's' : ''} uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
    if (!disabled && !uploading) {
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
    if (!disabled && !uploading) {
      setDragCounter(prev => Math.max(0, prev - 1));
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);

    if (disabled || uploading) return;

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
            disabled={disabled || uploading}
            data-testid="input-document-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('document-upload')?.click()}
            disabled={disabled || uploading}
            data-testid="button-upload-document"
          >
            {uploading ? (
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
