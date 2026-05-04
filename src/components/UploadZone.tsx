import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, FileVideo } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: { file: File; preview: string }[]) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isLoading }) => {
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPreviews = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
    onFilesSelected(newPreviews);
  }, [onFilesSelected]);

  const removeFile = (index: number) => {
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    onFilesSelected(newPreviews);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    disabled: isLoading
  });

  return (
    <div className="w-full space-y-8">
      <div
        {...getRootProps()}
        className={cn(
          "relative group border border-white/10 rounded-3xl p-32 transition-all duration-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden",
          isDragActive ? "bg-white/5 border-white/40" : "bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="text-white text-[12px] mb-4 opacity-20 group-hover:opacity-100 transition-opacity duration-700 select-none uppercase tracking-[0.8em] font-black">
          Upload_Media
        </div>
        <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-mono group-hover:text-white/40 transition-colors">
          Drag & Drop Neural Input [PNG. JPG. MP4]
        </p>
        
        {/* Subtle decorative lines */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8"
          >
            {previews.map((item, index) => (
              <motion.div 
                key={item.preview}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="group relative aspect-square rounded-2xl bg-white/5 overflow-hidden border border-white/10"
              >
                {item.file.type.startsWith('image') ? (
                  <img src={item.preview} alt="preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                ) : (
                  <video src={item.preview} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
