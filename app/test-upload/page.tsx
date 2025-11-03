'use client';

import { useState } from 'react';
import FileUpload from '@/components/marketplace/FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UploadedFile {
  url: string;
  publicId: string;
  format: string;
  size: number;
  type: 'config' | 'image';
  name: string;
}

export default function TestUploadPage() {
  const [configFile, setConfigFile] = useState<UploadedFile | undefined>();
  const [imageFile, setImageFile] = useState<UploadedFile | undefined>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">🧪 File Upload Test</h1>
          <p className="text-muted-foreground">
            Test Cloudinary integration before full marketplace integration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Configuration File</CardTitle>
            <CardDescription>
              Test uploading JSON or ZIP files (agent configs, workflows, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              type="config"
              label="Configuration File"
              description="Upload a .json or .zip file (max 10MB)"
              accept=".json,.zip"
              maxSize={10}
              onUpload={(file) => {
                console.log('Config file uploaded:', file);
                setConfigFile(file);
              }}
              onRemove={(publicId) => {
                console.log('Config file removed:', publicId);
                setConfigFile(undefined);
              }}
              currentFile={configFile}
            />

            {configFile && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Upload Successful!
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>URL:</strong> <a href={configFile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{configFile.url}</a></p>
                  <p><strong>Public ID:</strong> {configFile.publicId}</p>
                  <p><strong>Format:</strong> {configFile.format}</p>
                  <p><strong>Size:</strong> {(configFile.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Preview Image</CardTitle>
            <CardDescription>
              Test uploading images for marketplace listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              type="image"
              label="Preview Image"
              description="Upload a .jpg, .png, or .webp image (max 10MB)"
              accept="image/jpeg,image/png,image/webp"
              maxSize={10}
              onUpload={(file) => {
                console.log('Image file uploaded:', file);
                setImageFile(file);
              }}
              onRemove={(publicId) => {
                console.log('Image file removed:', publicId);
                setImageFile(undefined);
              }}
              currentFile={imageFile}
            />

            {imageFile && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Upload Successful!
                </h3>
                <div className="space-y-2">
                  <img
                    src={imageFile.url}
                    alt="Uploaded preview"
                    className="max-w-md rounded-lg border shadow-sm"
                  />
                  <div className="space-y-1 text-sm">
                    <p><strong>URL:</strong> <a href={imageFile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{imageFile.url}</a></p>
                    <p><strong>Public ID:</strong> {imageFile.publicId}</p>
                    <p><strong>Format:</strong> {imageFile.format}</p>
                    <p><strong>Size:</strong> {(imageFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span> Test Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={configFile ? "default" : "secondary"}>
                {configFile ? "✅" : "⏳"}
              </Badge>
              <span>Upload a config file (.json or .zip)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={imageFile ? "default" : "secondary"}>
                {imageFile ? "✅" : "⏳"}
              </Badge>
              <span>Upload an image file</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={configFile && imageFile ? "default" : "secondary"}>
                {configFile && imageFile ? "✅" : "⏳"}
              </Badge>
              <span>Both files uploaded successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Next</Badge>
              <span>Click delete button to test removal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Next</Badge>
              <span>Upload same file again to verify it works</span>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            🔍 What This Tests
          </h3>
          <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
            <li>✓ Cloudinary connection and authentication</li>
            <li>✓ File upload API endpoint</li>
            <li>✓ File validation (type and size)</li>
            <li>✓ Upload progress tracking</li>
            <li>✓ File preview display</li>
            <li>✓ Delete functionality</li>
            <li>✓ Error handling</li>
          </ul>
        </div>

        {(configFile || imageFile) && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              🎉 Success! What's Next?
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
              File uploads are working! Now we can:
            </p>
            <ol className="space-y-1 text-sm text-green-800 dark:text-green-200 list-decimal list-inside">
              <li>Integrate this into marketplace create/edit forms</li>
              <li>Update database schema to store file URLs</li>
              <li>Build download system for purchased items</li>
              <li>Create admin approval panel</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
