import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link as LinkIcon, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export interface DocumentForComparison {
  url: string;
  name: string;
  type?: string;
}

interface DocumentComparisonProps {
  documents: DocumentForComparison[];
}

export function DocumentComparison({ documents }: DocumentComparisonProps) {
  const [leftDoc, setLeftDoc] = useState(0);
  const [rightDoc, setRightDoc] = useState(documents.length > 1 ? 1 : 0);
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [leftNumPages, setLeftNumPages] = useState(0);
  const [rightNumPages, setRightNumPages] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [syncScroll, setSyncScroll] = useState(true);
  const [syncPages, setSyncPages] = useState(true);

  const handleZoom = (delta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + delta;
      return Math.max(0.3, Math.min(newScale, 2.0));
    });
  };

  const changeLeftPage = (offset: number) => {
    const newPage = Math.max(1, Math.min(leftPage + offset, leftNumPages));
    setLeftPage(newPage);
    if (syncPages) {
      setRightPage(Math.min(newPage, rightNumPages));
    }
  };

  const changeRightPage = (offset: number) => {
    const newPage = Math.max(1, Math.min(rightPage + offset, rightNumPages));
    setRightPage(newPage);
    if (syncPages) {
      setLeftPage(Math.min(newPage, leftNumPages));
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="document-comparison">
      {/* Toolbar */}
      <div className="border-b p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-medium">Left:</span>
            <Select value={leftDoc.toString()} onValueChange={(v) => setLeftDoc(parseInt(v))}>
              <SelectTrigger className="w-[200px]" data-testid="select-left-document">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-medium">Right:</span>
            <Select value={rightDoc.toString()} onValueChange={(v) => setRightDoc(parseInt(v))}>
              <SelectTrigger className="w-[200px]" data-testid="select-right-document">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(-0.1)}
              disabled={scale <= 0.3}
              data-testid="button-comparison-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(0.1)}
              disabled={scale >= 2.0}
              data-testid="button-comparison-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Sync controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={syncPages ? "default" : "outline"}
              size="sm"
              onClick={() => setSyncPages(!syncPages)}
              data-testid="button-sync-pages"
            >
              {syncPages ? <LinkIcon className="h-4 w-4 mr-2" /> : <Unlink className="h-4 w-4 mr-2" />}
              Sync Pages
            </Button>
          </div>
        </div>
      </div>

      {/* Side-by-side viewers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left document */}
        <div className="flex-1 flex flex-col border-r">
          <div className="border-b p-2 flex items-center justify-between">
            <Badge variant="secondary">{documents[leftDoc]?.type || "Document"}</Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeLeftPage(-1)}
                disabled={leftPage <= 1}
                data-testid="button-left-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {leftPage} / {leftNumPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeLeftPage(1)}
                disabled={leftPage >= leftNumPages}
                data-testid="button-left-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-start justify-center p-4">
            <div className="bg-white dark:bg-gray-800 shadow-lg">
              <Document
                file={documents[leftDoc]?.url}
                onLoadSuccess={({ numPages }) => setLeftNumPages(numPages)}
                loading={<div className="p-8">Loading...</div>}
                error={<div className="p-8 text-destructive">Failed to load</div>}
              >
                <Page pageNumber={leftPage} scale={scale} />
              </Document>
            </div>
          </div>
        </div>

        {/* Right document */}
        <div className="flex-1 flex flex-col">
          <div className="border-b p-2 flex items-center justify-between">
            <Badge variant="secondary">{documents[rightDoc]?.type || "Document"}</Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeRightPage(-1)}
                disabled={rightPage <= 1}
                data-testid="button-right-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {rightPage} / {rightNumPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeRightPage(1)}
                disabled={rightPage >= rightNumPages}
                data-testid="button-right-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-start justify-center p-4">
            <div className="bg-white dark:bg-gray-800 shadow-lg">
              <Document
                file={documents[rightDoc]?.url}
                onLoadSuccess={({ numPages }) => setRightNumPages(numPages)}
                loading={<div className="p-8">Loading...</div>}
                error={<div className="p-8 text-destructive">Failed to load</div>}
              >
                <Page pageNumber={rightPage} scale={scale} />
              </Document>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
