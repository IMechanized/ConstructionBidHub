import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileJson,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Briefcase,
  Sparkles,
  AlertTriangle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "analyzing" | "results" | "review" | "complete";

interface DraftRfp {
  id: number;
  title: string;
  clientName: string | null;
  description: string;
  jobState: string;
  jobCity: string | null;
  jobStreet: string | null;
  jobZip: string | null;
  deadline: string;
  budgetMin: number | null;
  certificationGoals: string[] | null;
  desiredTrades: string[] | null;
  portfolioLink: string | null;
  status: string;
}

interface ImportResult {
  drafts: DraftRfp[];
  duplicatesSkipped: number;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Not specified";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Not specified";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatBudget(amount: number | null) {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function FieldRow({
  icon: Icon,
  label,
  value,
  aiInferred,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  aiInferred?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        aiInferred
          ? "bg-violet-100 dark:bg-violet-950"
          : "bg-slate-100 dark:bg-slate-800"
      )}>
        <Icon className={cn("h-3.5 w-3.5", aiInferred ? "text-violet-600 dark:text-violet-400" : "text-slate-600 dark:text-slate-400")} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {aiInferred && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 border-violet-300 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              AI filled
            </Badge>
          )}
        </div>
        <div className="text-sm mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function RfpPreviewCard({
  rfp,
  index,
  total,
  onPublish,
  onDiscard,
  isPublishing,
  isDiscarding,
}: {
  rfp: DraftRfp;
  index: number;
  total: number;
  onPublish: () => void;
  onDiscard: () => void;
  isPublishing: boolean;
  isDiscarding: boolean;
}) {
  const locationParts = [rfp.jobCity, rfp.jobState, rfp.jobZip].filter(Boolean).join(", ");

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {index + 1} of {total}
              </Badge>
              <Badge variant="secondary" className="text-xs">Draft</Badge>
            </div>
            <CardTitle className="text-lg leading-tight">{rfp.title}</CardTitle>
            {rfp.clientName && (
              <p className="text-sm text-muted-foreground mt-1">{rfp.clientName}</p>
            )}
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-1.5 mt-3" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
          <div
            className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow
            icon={Calendar}
            label="Deadline"
            value={formatDate(rfp.deadline)}
          />
          {rfp.budgetMin && (
            <FieldRow
              icon={DollarSign}
              label="Estimated Budget"
              value={formatBudget(rfp.budgetMin)}
              aiInferred
            />
          )}
          {locationParts && (
            <FieldRow
              icon={MapPin}
              label="Location"
              value={locationParts}
              aiInferred={!!(rfp.jobCity || rfp.jobZip)}
            />
          )}
          {rfp.portfolioLink && (
            <FieldRow
              icon={Globe}
              label="Source Link"
              value={
                <a
                  href={rfp.portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {rfp.portfolioLink}
                </a>
              }
            />
          )}
        </div>

        {rfp.desiredTrades && rfp.desiredTrades.length > 0 && (
          <FieldRow
            icon={Briefcase}
            label="Desired Trades"
            value={
              <div className="flex flex-wrap gap-1.5 mt-1">
                {rfp.desiredTrades.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            }
          />
        )}

        {rfp.certificationGoals && rfp.certificationGoals.length > 0 && (
          <FieldRow
            icon={Tag}
            label="Certification Goals"
            aiInferred
            value={
              <div className="flex flex-wrap gap-1.5 mt-1">
                {rfp.certificationGoals.map((c) => (
                  <Badge key={c} variant="outline" className="text-xs border-violet-300 text-violet-700 dark:text-violet-300">{c}</Badge>
                ))}
              </div>
            }
          />
        )}

        <Separator />

        <FieldRow
          icon={FileText}
          label="Description"
          value={
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5">
              {rfp.description}
            </p>
          }
        />

        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-md px-2 py-1">
            <Sparkles className="h-3 w-3 text-violet-500" aria-hidden="true" />
            <span>Fields with the AI badge were enriched by DeepSeek</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t">
          <Button
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
            onClick={onDiscard}
            disabled={isDiscarding || isPublishing}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {isDiscarding ? "Discarding..." : "Discard"}
          </Button>
          <Button
            className="gap-2 bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-none"
            onClick={onPublish}
            disabled={isPublishing || isDiscarding}
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminRfpImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [published, setPublished] = useState(0);
  const [discarded, setDiscarded] = useState(0);

  const { data: existingDrafts } = useQuery<DraftRfp[]>({
    queryKey: ["/api/admin/rfp-drafts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rfp-drafts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return res.json();
    },
  });

  const importMutation = useMutation({
    mutationFn: async (jsonData: any[]) => {
      const res = await apiRequest("POST", "/api/admin/rfp-import/preview", jsonData);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setCurrentIndex(0);
      setPublished(0);
      setDiscarded(0);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rfp-drafts"] });
      setStep("results");
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
      setStep("upload");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/rfp-drafts/${id}/publish`);
      if (!res.ok) throw new Error("Failed to publish");
      return res.json();
    },
    onSuccess: () => {
      setPublished((p) => p + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rfp-drafts"] });
      advance();
    },
    onError: (err: Error) => {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    },
  });

  const discardMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/rfp-drafts/${id}`);
      if (!res.ok) throw new Error("Failed to discard");
      return res.json();
    },
    onSuccess: () => {
      setDiscarded((d) => d + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rfp-drafts"] });
      advance();
    },
    onError: (err: Error) => {
      toast({ title: "Discard failed", description: err.message, variant: "destructive" });
    },
  });

  function advance() {
    const drafts = importResult?.drafts || [];
    if (currentIndex + 1 >= drafts.length) {
      setStep("complete");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function validateAndSetFile(file: File) {
    setFileError(null);
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setFileError("Only JSON files are supported. Please select a .json file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File is too large. Maximum size is 10MB.");
      return;
    }
    setSelectedFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  async function handleImport() {
    if (!selectedFile) return;
    setStep("analyzing");
    try {
      const text = await selectedFile.text();
      const json = JSON.parse(text);
      const arr = Array.isArray(json) ? json : [json];
      importMutation.mutate(arr);
    } catch {
      toast({ title: "Invalid JSON", description: "The file could not be parsed as valid JSON.", variant: "destructive" });
      setStep("upload");
    }
  }

  const drafts = importResult?.drafts || [];
  const currentDraft = drafts[currentIndex];
  const hasPendingDrafts = Array.isArray(existingDrafts) && existingDrafts.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RFP Import</h1>
          <p className="text-muted-foreground">Upload a JSON file to import RFPs with AI-powered enrichment</p>
        </div>

        {hasPendingDrafts && step === "upload" && (
          <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
                    {existingDrafts!.length} draft{existingDrafts!.length !== 1 ? "s" : ""} pending review
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                    You have unreviewed drafts from a previous import.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-violet-600 hover:bg-violet-700"
                    onClick={() => {
                      setImportResult({ drafts: existingDrafts!, duplicatesSkipped: 0 });
                      setCurrentIndex(0);
                      setPublished(0);
                      setDiscarded(0);
                      setStep("review");
                    }}
                  >
                    Resume Review
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload JSON File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop zone for JSON file upload"
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
                  isDragging
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-muted-foreground/30 hover:border-violet-400 hover:bg-muted/50",
                  selectedFile && "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={handleFileChange}
                  aria-label="Select JSON file"
                />
                {selectedFile ? (
                  <>
                    <FileJson className="h-10 w-10 text-green-500 mb-3" aria-hidden="true" />
                    <p className="font-semibold text-green-700 dark:text-green-400">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
                    <p className="font-semibold">Drop your JSON file here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-3">Supports .json files up to 10MB</p>
                  </>
                )}
              </div>

              {fileError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {fileError}
                </div>
              )}

              <Button
                className="w-full bg-violet-600 hover:bg-violet-700"
                size="lg"
                disabled={!selectedFile || !!fileError}
                onClick={handleImport}
              >
                <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                Analyze with AI
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "analyzing" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950 mx-auto">
                <Sparkles className="h-8 w-8 text-violet-600 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-semibold">Analyzing with AI...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  DeepSeek is reading your file and enriching each RFP with location and trade data.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "results" && importResult && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" aria-hidden="true" />
                <h2 className="text-xl font-bold">Analysis Complete</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Review your imported RFPs before publishing them to the platform.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-violet-600">{importResult.drafts.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">New RFPs ready for review</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">{importResult.duplicatesSkipped}</p>
                  <p className="text-sm text-muted-foreground mt-1">Duplicates automatically skipped</p>
                </div>
              </div>

              {importResult.duplicatesSkipped > 0 && (
                <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-amber-800 dark:text-amber-200">
                    {importResult.duplicatesSkipped} RFP{importResult.duplicatesSkipped !== 1 ? "s were" : " was"} skipped because they already exist in the database (matched by title and client name).
                  </p>
                </div>
              )}

              {importResult.drafts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">All RFPs in this file were already in the database.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => { setStep("upload"); setSelectedFile(null); }}
                  >
                    Upload Another File
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  size="lg"
                  onClick={() => setStep("review")}
                >
                  Start Reviewing
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === "review" && currentDraft && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Reviewing RFP {currentIndex + 1} of {drafts.length}</span>
            </div>

            <RfpPreviewCard
              rfp={currentDraft}
              index={currentIndex}
              total={drafts.length}
              onPublish={() => publishMutation.mutate(currentDraft.id)}
              onDiscard={() => discardMutation.mutate(currentDraft.id)}
              isPublishing={publishMutation.isPending}
              isDiscarding={discardMutation.isPending}
            />

            {drafts.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  aria-label="Previous RFP"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex((i) => Math.min(drafts.length - 1, i + 1))}
                  disabled={currentIndex >= drafts.length - 1}
                  aria-label="Next RFP"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "complete" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold">Review Complete!</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  All imported RFPs have been reviewed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{published}</p>
                  <p className="text-sm text-muted-foreground mt-1">Published</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-muted-foreground">{discarded}</p>
                  <p className="text-sm text-muted-foreground mt-1">Discarded</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                <Link href="/admin/rfps">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    View RFP Management
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setSelectedFile(null);
                    setImportResult(null);
                    setCurrentIndex(0);
                    setPublished(0);
                    setDiscarded(0);
                  }}
                >
                  Import Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
