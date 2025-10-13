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
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload document');
        }

        const data = await response.json();
        return {
          filename: data.filename,
          fileUrl: data.url,
          documentType: "specification" as const, // Default type, user can change
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
      // Reset file input
      e.target.value = '';
    }
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
      <div>
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
              Upload Documents
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Supported formats: PDF, Word, Excel, Text files (Max 5MB each)
        </p>
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
