import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface MediaAsset {
  id: string;
  name: string;
  label: string;
  url: string;
  usesCount?: number;
}

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  subject?: string;
}

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  subject
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Upload Tab state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const items = await api.getMedia(subject);
      setAssets(items || []);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedUrl(null);
      setPreviewFile(null);
      setActiveTab('library');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredAssets = assets.filter(a => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (a.name || '').toLowerCase().includes(query) ||
      (a.label || '').toLowerCase().includes(query)
    );
  });

  const handleSelectAndConfirm = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewFile({ file, url });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewFile({ file, url });
    }
  };

  const handleUploadAndInsert = async () => {
    if (!previewFile) return;
    setUploading(true);
    try {
      let finalUrl = '';
      try {
        const res = await api.uploadAsset(previewFile.file, subject);
        finalUrl = res.url;
      } catch {
        finalUrl = previewFile.url;
      }
      onSelectImage(finalUrl);
      onClose();
    } catch (err) {
      console.error('Failed uploading asset:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Image Library</h2>
              <p className="text-[11px] text-slate-500 font-medium">Select an image from Media Library or upload a new diagram</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 gap-6 text-xs font-bold bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Select from Library ({assets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload New Image
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {activeTab === 'library' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search image by name or label (e.g. Figure, Cell, Chemistry)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                  <span>Loading Image Library...</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-xl border border-dashed border-slate-300 p-8">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No images found in Media Library</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Upload First Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredAssets.map(asset => {
                    const isSelected = selectedUrl === asset.url;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedUrl(asset.url)}
                        className={`group relative bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col ${
                          isSelected ? 'border-teal-600 ring-2 ring-teal-600' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="h-32 bg-slate-100 relative flex items-center justify-center p-2 overflow-hidden">
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 bg-white border-t border-slate-100 space-y-0.5">
                          <p className="text-[11px] font-bold text-slate-800 truncate" title={asset.name}>
                            {asset.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-semibold rounded uppercase">
                              {asset.label || 'FIGURE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto py-4">
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-all ${
                  dragActive ? 'border-teal-600 bg-teal-50/50' : 'border-slate-300 hover:border-teal-600 bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {previewFile ? (
                  <div className="space-y-2">
                    <img src={previewFile.url} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain" />
                    <p className="text-xs font-bold text-slate-700 truncate">{previewFile.file.name}</p>
                    <p className="text-[10px] text-slate-400">Click to choose another image</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto font-bold">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Click or drag & drop image file</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP, SVG</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'library' ? (
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={() => selectedUrl && handleSelectAndConfirm(selectedUrl)}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Insert Selected Image
            </button>
          ) : (
            <button
              type="button"
              disabled={!previewFile || uploading}
              onClick={handleUploadAndInsert}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{uploading ? 'Uploading...' : 'Upload & Insert Image'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
