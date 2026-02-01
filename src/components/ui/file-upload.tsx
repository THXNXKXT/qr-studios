"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileIcon, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const fileUploadLogger = createLogger("ui:file-upload");

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onUploadSuccess?: (url: string, key: string) => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  label?: string;
  folder?: string;
  autoUpload?: boolean;
  showPreview?: boolean;
  value?: string | null; // Added: current URL to show preview
}

export function FileUpload({
  onFileSelect,
  onUploadSuccess,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    "application/zip": [".zip"],
    "application/x-zip-compressed": [".zip"],
  },
  className,
  label = "Click or drag file to upload",
  folder = "general",
  autoUpload = true,
  showPreview = true,
  value = null,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > maxSize) {
        toast.error(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      setSelectedFile(file);
      
      // Create local preview URL for images
      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);
        fileUploadLogger.debug('Created preview URL', { url: objectUrl });
      } else {
        setLocalPreview(null);
      }

      // Notify parent immediately of selection
      onFileSelect?.(file);

      fileUploadLogger.debug('autoUpload setting', { autoUpload });

      if (autoUpload === true) {
        setIsUploading(true);
        try {
          const result = await adminApi.uploadFile(file, folder);

          if (result.error) {
            throw new Error(result.error.message || "Failed to upload file");
          }

          const url = (result.data as any)?.url;
          const key = (result.data as any)?.key;
          if (url && key) {
            toast.success("File uploaded successfully");
            onUploadSuccess?.(url, key);
          }
        } catch (err: any) {
          fileUploadLogger.error('Upload error', { error: err });
          toast.error(err.message || "Failed to upload file");
        } finally {
          setIsUploading(false);
        }
      }
    },
    [maxSize, onUploadSuccess, onFileSelect, autoUpload, folder]
  );

  // Clean up object URL
  React.useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const displayPreview = localPreview || value;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
        isDragActive
          ? "border-red-500 bg-red-500/5"
          : "border-white/10 hover:border-white/20 bg-white/5",
        isUploading && "pointer-events-none opacity-60",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-white">Uploading...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait while we process your file</p>
          </>
        ) : showPreview && displayPreview ? (
          <div className="relative group/preview w-full aspect-video rounded-xl overflow-hidden border border-white/10">
            <img src={displayPreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-xs font-bold text-white uppercase tracking-widest">Click to change</p>
            </div>
          </div>
        ) : selectedFile ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-green-500">
              <FileIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-white max-w-full truncate px-4">{selectedFile.name}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">File selected</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className={cn("w-6 h-6", isDragActive ? "text-red-500" : "text-gray-400")} />
            </div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-gray-500 mt-2">
              Max file size: {maxSize / (1024 * 1024)}MB
            </p>
          </>
        )}
      </div>

      {isDragActive && (
        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[2px]">
          <p className="text-red-500 font-bold animate-bounce">Drop to upload</p>
        </div>
      )}
    </div>
  );
}
