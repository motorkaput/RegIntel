'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertCircle, CheckCircle, Eye } from 'lucide-react';

interface CSVRow {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  manager_email?: string;
  skills?: string;
  location?: string;
  aliases?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  ok: boolean;
  created: number;
  updated: number;
  skills_added: number;
  upload_url: string;
}

export default function OrgUploadPage() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim());
    const data: CSVRow[] = [];
    const validationErrors: ValidationError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Basic validation
      if (!row.first_name) {
        validationErrors.push({
          row: i,
          field: 'first_name',
          message: 'First name is required'
        });
      }

      if (!row.last_name) {
        validationErrors.push({
          row: i,
          field: 'last_name',
          message: 'Last name is required'
        });
      }

      if (!row.email || !row.email.includes('@')) {
        validationErrors.push({
          row: i,
          field: 'email',
          message: 'Valid email is required'
        });
      }

      const validRoles = ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'];
      if (!validRoles.includes(row.role)) {
        validationErrors.push({
          row: i,
          field: 'role',
          message: `Role must be one of: ${validRoles.join(', ')}`
        });
      }

      data.push(row);
    }

    setCsvData(data);
    setErrors(validationErrors);
  };

  const downloadSample = () => {
    const sampleCSV = `first_name,last_name,email,role,manager_email,skills,location,aliases
Asha,Menon,asha@acme.local,org_leader,,product strategy|design leadership,Bengaluru,asham|asha.m
Ravi,Kapoor,ravi@acme.local,functional_leader,asha@acme.local,backend,Delhi,r.kapoor
Nina,Sharma,nina@acme.local,project_lead,ravi@acme.local,frontend,Remote,nina.s
Dev,Patel,dev@acme.local,team_member,nina@acme.local,react|javascript,Bengaluru,dev.p
Meera,Iyer,meera@acme.local,team_member,nina@acme.local,testing|qa,Bengaluru,meera`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-employees.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (errors.length > 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/org-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: csvData }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      org_leader: 'bg-purple-100 text-purple-800',
      functional_leader: 'bg-blue-100 text-blue-800',
      project_lead: 'bg-green-100 text-green-800',
      team_member: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organization Upload</h1>
        <p className="text-gray-600 mt-2">
          Upload employee data via CSV to populate your organization structure
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>CSV Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              data-testid="csv-dropzone"
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the CSV file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop a CSV file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported format: CSV with employee data
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={downloadSample}
                data-testid="button-download-sample"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>

              {fileName && (
                <div className="text-sm text-gray-600">
                  Selected: {fileName}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Validation Errors ({errors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell className="font-mono text-sm">{error.field}</TableCell>
                      <TableCell className="text-red-600">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {csvData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Data Preview ({csvData.length} rows)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {row.first_name} {row.last_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(row.role)}>
                          {row.role?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{row.manager_email || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {row.skills ? row.skills.slice(0, 30) + '...' : '-'}
                      </TableCell>
                      <TableCell>{row.location || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {csvData.length > 10 && (
                <p className="text-center text-gray-500 mt-4">
                  ... and {csvData.length - 10} more rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Upload completed successfully!</p>
                  <div className="text-sm space-y-1">
                    <p>• {uploadResult.created} users created</p>
                    <p>• {uploadResult.updated} users updated</p>
                    <p>• {uploadResult.skills_added} skills added</p>
                    <p>• File saved to: {uploadResult.upload_url}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Eye className="h-4 w-4 mr-2" />
                    View Audit Log
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={csvData.length === 0 || errors.length > 0 || isUploading}
          data-testid="button-submit-upload"
        >
          {isUploading ? 'Uploading...' : 'Upload Organization Data'}
        </Button>
      </div>
    </div>
  );
}