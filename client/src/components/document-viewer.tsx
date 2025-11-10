import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  X,
  Highlighter,
  StickyNote,
  Bookmark,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export interface Annotation {
  id: string;
  type: "highlight" | "note" | "bookmark";
  pageNumber: number;
  position: { x: number; y: number };
  content?: string;
  color?: string;
  createdAt: number;
}

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  onClose?: () => void;
}

export function DocumentViewer({ fileUrl, fileName, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState<"none" | "highlight" | "note" | "bookmark">("none");
  const [showAnnotations, setShowAnnotations] = useState(true);

  const storageKey = `document-annotations-${fileName}`;

  // Load annotations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setAnnotations(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load annotations:", error);
    }
  }, [storageKey]);

  // Save annotations to localStorage
  const saveAnnotations = (newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newAnnotations));
    } catch (error) {
      console.error("Failed to save annotations:", error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(newPageNumber, numPages));
    });
  };

  const handleZoom = (delta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + delta;
      return Math.max(0.5, Math.min(newScale, 3.0));
    });
  };

  const addAnnotation = (type: Annotation["type"], position: { x: number; y: number }, content?: string) => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type,
      pageNumber,
      position,
      content,
      color: type === "highlight" ? "#FFEB3B" : undefined,
      createdAt: Date.now(),
    };
    saveAnnotations([...annotations, newAnnotation]);
  };

  const removeAnnotation = (id: string) => {
    saveAnnotations(annotations.filter(a => a.id !== id));
  };

  const pageAnnotations = annotations.filter(a => a.pageNumber === pageNumber);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-background" data-testid="document-viewer">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-viewer">
              <X className="h-4 w-4" />
            </Button>
          )}
          <span className="font-medium text-sm truncate max-w-xs">{fileName}</span>
        </div>

        <div className="flex-1" />

        {/* Annotation tools */}
        <div className="flex items-center gap-1 border-x px-2">
          <Button
            variant={annotationMode === "highlight" ? "default" : "ghost"}
            size="sm"
            onClick={() => setAnnotationMode(annotationMode === "highlight" ? "none" : "highlight")}
            data-testid="button-highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            variant={annotationMode === "note" ? "default" : "ghost"}
            size="sm"
            onClick={() => setAnnotationMode(annotationMode === "note" ? "none" : "note")}
            data-testid="button-note"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          <Button
            variant={annotationMode === "bookmark" ? "default" : "ghost"}
            size="sm"
            onClick={() => setAnnotationMode(annotationMode === "bookmark" ? "none" : "bookmark")}
            data-testid="button-bookmark"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            data-testid="button-next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-0.2)}
            disabled={scale <= 0.5}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(0.2)}
            disabled={scale >= 3.0}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-start justify-center p-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              }
              error={
                <div className="p-8 text-center">
                  <p className="text-destructive">Failed to load PDF</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </div>

        {/* Annotations sidebar */}
        {annotations.length > 0 && (
          <div className="w-64 border-l bg-background flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Annotations</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {annotations.length} total, {pageAnnotations.length} on this page
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {pageAnnotations.map(annotation => (
                  <Card key={annotation.id} className="p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {annotation.type === "highlight" && <Highlighter className="h-3 w-3" />}
                          {annotation.type === "note" && <StickyNote className="h-3 w-3" />}
                          {annotation.type === "bookmark" && <Bookmark className="h-3 w-3" />}
                          <Badge variant="secondary" className="text-xs">
                            {annotation.type}
                          </Badge>
                        </div>
                        {annotation.content && (
                          <p className="text-xs">{annotation.content}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeAnnotation(annotation.id)}
                        data-testid={`button-delete-annotation-${annotation.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

// Fullscreen document viewer dialog
interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
}

export function DocumentViewerDialog({
  open,
  onOpenChange,
  fileUrl,
  fileName,
}: DocumentViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0" data-testid="document-viewer-dialog">
        <DocumentViewer
          fileUrl={fileUrl}
          fileName={fileName}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
