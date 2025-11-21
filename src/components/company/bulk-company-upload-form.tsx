/**
 * @fileoverview A client-side component for handling bulk company uploads from a file.
 *
 * This component provides a user interface for administrators to upload an Excel or
 * CSV file containing company data. It handles file parsing, validation of headers,
 * submission to a server action for processing, and the display of detailed
 * results and a summary of the operation.
 */
"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { bulkAddCompanies as bulkAddCompaniesAction } from "@/app/actions";
import {
  Loader2,
  UploadCloud,
  AlertCircle,
  CheckCircle,
  Info,
  Edit3,
  LibraryBig,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Represents the expected structure of a row from the uploaded file (client-side).
 * Headers must match these keys.
 */
interface RawExcelCompanyDataForClient {
  Name: string;
  Logo?: string;
  Description?: string;
  Website?: string;
  Related?: string;
  [key: string]: any;
}

/**
 * Represents the detailed result for a single row processed in the bulk upload.
 */
interface BulkAddCompanyResult {
  rowIndex: number;
  name: string;
  status: "added" | "updated" | "skipped" | "error";
  message: string;
}

/**
 * Props for the BulkCompanyUploadForm component.
 */
interface BulkCompanyUploadFormProps {
  /** An array of existing company names, used for informational purposes. */
  existingCompanyNames: string[];
}

/**
 * Renders a form for uploading a file to bulk-add or update companies.
 *
 * This component manages the file selection, parsing, and submission process.
 * Key functionalities include:
 * - Allowing the user to select multiple `.xlsx` or `.csv` files.
 * - Parsing the file content using the `xlsx` library on the client side.
 * - Validating the presence of required column headers (`Name`).
 * - Calling a server action (`bulkAddCompaniesAction`) with the parsed data in chunks.
 * - Displaying a loading state during processing.
 * - Rendering a detailed, color-coded summary of the results (added, updated, skipped, error)
 *   in a scrollable area.
 *
 * @param {BulkCompanyUploadFormProps} props - The props for the component.
 * @returns {JSX.Element} The rendered bulk upload form component.
 */
export default function BulkCompanyUploadForm({
  existingCompanyNames,
}: BulkCompanyUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [results, setResults] = useState<BulkAddCompanyResult[] | null>(null);
  const [summary, setSummary] = useState<{
    added: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(Array.from(event.target.files));
      setResults(null);
      setSummary(null);
    }
  };

  const readFile = (file: File): Promise<RawExcelCompanyDataForClient[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result;
          if (!arrayBuffer) {
            reject(new Error(`Could not read file data from ${file.name}.`));
            return;
          }
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            reject(new Error(`The file ${file.name} does not contain any sheets.`));
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            reject(new Error(`Could not read the first sheet from ${file.name}.`));
            return;
          }
          
          // Validate headers
          const headerRowJson = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });
          if (!headerRowJson || headerRowJson.length === 0) {
             reject(new Error(`Could not read headers from ${file.name}.`));
             return;
          }
          const headerRow = headerRowJson[0] as string[];
          const actualHeaders = headerRow.map((h) => String(h).trim());
          if (!actualHeaders.includes("Name")) {
            reject(new Error(`File ${file.name} is missing required header 'Name'.`));
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json<RawExcelCompanyDataForClient>(
            worksheet,
            { defval: "" },
          );
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error(`File read error for ${file.name}`));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: "No file selected",
        description:
          "Please select at least one Excel (.xlsx) or CSV (.csv) file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setSummary(null);
    setProcessingStatus("Reading files...");
    toast({
      title: "Starting Process",
      description: `Reading ${files.length} file(s)...`,
    });

    try {
      // 1. Read and merge all files
      let allCompanies: {
        name: string;
        logo: string;
        description: string;
        website: string;
        relatedCompanies: string[];
      }[] = [];

      for (const file of files) {
        try {
            const data = await readFile(file);
            const mappedData = data.map(row => ({
                name: String(row.Name || "").trim(),
                logo: String(row.Logo || "").trim(),
                description: String(row.Description || "").trim(),
                website: String(row.Website || "").trim(),
                relatedCompanies: row.Related
                  ? String(row.Related).split(";").map(s => s.trim()).filter(s => s.length > 0)
                  : [],
            })).filter(c => c.name.length > 0); // Filter out empty names immediately
            allCompanies = [...allCompanies, ...mappedData];
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown parsing error";
            toast({
                title: "File Error",
                description: msg,
                variant: "destructive"
            });
            setIsProcessing(false);
            return; // Stop if any file fails to read
        }
      }

      if (allCompanies.length === 0) {
        toast({
            title: "No Data Found",
            description: "The selected files contain no valid company data.",
            variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // 2. Chunk processing
      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < allCompanies.length; i += CHUNK_SIZE) {
        chunks.push(allCompanies.slice(i, i + CHUNK_SIZE));
      }

      let totalAdded = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      let aggregatedResults: BulkAddCompanyResult[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setProcessingStatus(`Processing chunk ${i + 1} of ${chunks.length}...`);
        const chunk = chunks[i];
        
        try {
            const response = await bulkAddCompaniesAction(chunk);
            totalAdded += response.addedCount;
            totalUpdated += response.updatedCount;
            totalSkipped += response.skippedCount;
            totalErrors += response.errorCount;
            
            // Adjust row indices to be global relative to the merged dataset
            const chunkResults = response.detailedResults.map(r => ({
                ...r,
                rowIndex: r.rowIndex + (i * CHUNK_SIZE) // Offset by previous chunks
            }));
            aggregatedResults = [...aggregatedResults, ...chunkResults];
        } catch (e) {
            console.error("Chunk processing error:", e);
            totalErrors += chunk.length;
            aggregatedResults.push({
                rowIndex: i * CHUNK_SIZE,
                name: "Chunk Error",
                status: "error",
                message: "Server error processing this batch."
            });
        }
      }

      setResults(aggregatedResults);
      setSummary({
        added: totalAdded,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: totalErrors,
      });

      toast({
        title: "Bulk Processing Complete",
        description: `Processed ${allCompanies.length} records. Added: ${totalAdded}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}, Failed: ${totalErrors}.`,
      });

    } catch (error) {
      console.error("Global processing error:", error);
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred during the bulk upload process.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LibraryBig className="h-6 w-6" />
          Bulk Upload Companies
        </CardTitle>
        <CardDescription>
          Select one or more .xlsx or .csv files. Required header:{" "}
          <strong>Name</strong>. Optional headers:{" "}
          <strong>Logo, Description, Website, Related</strong>.
          <br />
          Data from all files will be merged and processed in batches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input
            type="file"
            accept=".xlsx,.csv"
            multiple
            onChange={handleFileChange}
            className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingStatus || "Processing..."}
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Process Files
              </>
            )}
          </Button>
        </div>
        {files.length > 0 && (
            <p className="text-sm text-muted-foreground">
                Selected {files.length} file(s): {files.map(f => f.name).join(", ")}
            </p>
        )}
      </CardContent>
      {summary && (
        <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
          <h3 className="font-semibold text-lg">Processing Summary:</h3>
          <p className="flex items-center gap-1">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Successfully Added: {summary.added}
          </p>
          <p className="flex items-center gap-1">
            <Edit3 className="h-5 w-5 text-blue-500" />
            Successfully Updated: {summary.updated}
          </p>
          <p className="flex items-center gap-1">
            <Info className="h-5 w-5 text-yellow-600" />
            Skipped (No Changes): {summary.skipped}
          </p>
          <p className="flex items-center gap-1">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Failed: {summary.errors}
          </p>
        </CardFooter>
      )}
      {results && results.length > 0 && (
        <div className="p-6 pt-0">
          <h3 className="font-semibold text-lg mb-2">Detailed Results:</h3>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/30">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border ${
                    result.status === "added"
                      ? "bg-green-50 border-green-200"
                      : result.status === "updated"
                        ? "bg-blue-50 border-blue-200"
                        : result.status === "skipped"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className="font-medium text-sm">
                    Row {result.rowIndex + 1}:{" "}
                    {result.name || "(No Name Provided)"} -{" "}
                    <span
                      className={`font-semibold ${
                        result.status === "added"
                          ? "text-green-700"
                          : result.status === "updated"
                            ? "text-blue-700"
                            : result.status === "skipped"
                              ? "text-yellow-700"
                              : "text-red-700"
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </p>
                  {result.status === "error" && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {result.message}
                    </p>
                  )}
                  {result.status !== "error" && result.message && (
                    <p className="text-xs text-gray-600 mt-1">
                      {result.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}
