
'use client';

import type { LastAskedPeriod } from '@/types';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { bulkAddProblems as bulkAddProblemsAction } from '@/app/actions';
import { Loader2, UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RawExcelProblemDataForClient {
  Title: string;
  Difficulty: string; // Accepts any string from Excel, server will normalize/validate
  Link: string;
  Tags: string; // Comma-separated
  'Company Name': string;
  'Last Asked Period': LastAskedPeriod; // Client assumes it's valid, server validates
  [key: string]: any; 
}

interface BulkAddResult {
  rowIndex: number;
  title: string;
  status: 'added' | 'updated' | 'error';
  message: string;
}

interface BulkProblemUploadFormProps {
  companyNames: string[]; 
}

export default function BulkProblemUploadForm({ companyNames }: BulkProblemUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkAddResult[] | null>(null);
  const [summary, setSummary] = useState<{ added: number, updated: number, errors: number } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setResults(null); 
      setSummary(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select an Excel file to upload.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setSummary(null);
    toast({ title: 'Processing File...', description: 'Reading and processing your Excel file.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          throw new Error("Could not read file data. The file might be empty or corrupted.");
        }
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            throw new Error("The Excel file does not contain any sheets.");
        }
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
            throw new Error(`Could not read the first sheet ('${firstSheetName}') from the Excel file.`);
        }
        
        const jsonData = XLSX.utils.sheet_to_json<RawExcelProblemDataForClient>(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          toast({ title: 'Empty Data', description: 'The first sheet of the Excel file is empty or contains no data rows.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }
        
        const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })[0] as string[];
        if (!headerRow || headerRow.length === 0) {
            throw new Error("Could not read the header row from the Excel sheet.");
        }

        const requiredHeaders = ["Title", "Difficulty", "Link", "Tags", "Company Name", "Last Asked Period"];
        const actualHeaders = headerRow.map(h => String(h).trim()); 
        
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
            toast({
                title: "Missing Required Headers",
                description: `The Excel file's first sheet is missing the following column header(s): ${missingHeaders.join(", ")}. Please ensure the file contains these exact headers. Found headers: ${actualHeaders.join(", ")}`,
                variant: "destructive",
                duration: 15000, 
            });
            setIsProcessing(false);
            return;
        }


        const problemsToSubmit = jsonData.map(row => ({
          title: String(row.Title || '').trim(),
          difficulty: String(row.Difficulty || '').trim(), // Send as string
          link: String(row.Link || '').trim(),
          tags: String(row.Tags || '').trim(), 
          companyName: String(row['Company Name'] || '').trim(),
          lastAskedPeriod: String(row['Last Asked Period'] || '').trim() as LastAskedPeriod, // Send as string, server validates
        }));

        const response = await bulkAddProblemsAction(problemsToSubmit);
        setResults(response.detailedResults);
        setSummary({ added: response.addedCount, updated: response.updatedCount, errors: response.errorCount });

        toast({
          title: 'Bulk Processing Complete',
          description: `${response.addedCount} added, ${response.updatedCount} updated, ${response.errorCount} failed.`,
        });

      } catch (error) {
        console.error("Error processing Excel file:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during file processing.";
        toast({ title: 'File Processing Error', description: errorMessage, variant: 'destructive', duration: 10000 });
        setResults([{ rowIndex: 0, title: "File Processing Error", status: 'error', message: `Error processing file: ${errorMessage}` }]);
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({ title: 'File Read Error', description: 'Could not read the selected file. It might be corrupted or in an unexpected format.', variant: 'destructive'});
        setIsProcessing(false);
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    } else {
      toast({ title: 'No file found', description: 'File became unavailable before reading.', variant: 'destructive'});
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Upload Excel File
        </CardTitle>
        <CardDescription>
          Select a .xlsx file. Available company names include: {companyNames.slice(0, 5).join(', ')}{companyNames.length > 5 ? ', and more...' : '.'}
          <br />
          Required headers: Title, Difficulty, Link, Tags, Company Name, Last Asked Period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            disabled={isProcessing}
          />
          <Button onClick={handleSubmit} disabled={!file || isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Process File
              </>
            )}
          </Button>
        </div>
      </CardContent>
      {summary && (
        <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
            <h3 className="font-semibold text-lg">Processing Summary:</h3>
            <p className="flex items-center gap-1"><CheckCircle className="h-5 w-5 text-green-500" />Successfully Added: {summary.added}</p>
            <p className="flex items-center gap-1"><Info className="h-5 w-5 text-blue-500" />Successfully Updated: {summary.updated}</p>
            <p className="flex items-center gap-1"><AlertCircle className="h-5 w-5 text-red-500" />Failed: {summary.errors}</p>
        </CardFooter>
      )}
      {results && results.length > 0 && (
        <div className="p-6 pt-0">
          <h3 className="font-semibold text-lg mb-2">Detailed Results:</h3>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/30">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className={`p-3 rounded-md border ${
                  result.status === 'added' ? 'bg-green-50 border-green-200' :
                  result.status === 'updated' ? 'bg-blue-50 border-blue-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <p className="font-medium text-sm">
                    Row {result.rowIndex + 2}: {result.title || '(No Title Provided)'} - <span className={`font-semibold ${
                      result.status === 'added' ? 'text-green-700' :
                      result.status === 'updated' ? 'text-blue-700' :
                      'text-red-700'
                    }`}>{result.status.toUpperCase()}</span>
                  </p>
                  {result.status === 'error' && <p className="text-xs text-red-600 mt-1">Error: {result.message}</p>}
                  {result.status !== 'error' && result.message && <p className="text-xs text-gray-600 mt-1">{result.message}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}
