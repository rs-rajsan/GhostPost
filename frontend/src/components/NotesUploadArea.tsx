import { useState, useRef } from 'react';
import { Upload, FileImage, FileText, Loader2, Copy, Check } from 'lucide-react';
import api from '../lib/api';
import config from '../config';

export default function NotesUploadArea() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [notes, setNotes] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (selectedFile: File) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Please upload a valid image (JPEG, PNG, WebP)');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
             setError('File is too large. Max size is 5MB.');
             return;
        }

        setFile(selectedFile);
        setError(null);
        await uploadFile(selectedFile);
    };

    const uploadFile = async (fileToUpload: File) => {
        setIsPending(true);
        setNotes(null);
        setError(null);

        const formData = new FormData();
        formData.append('image', fileToUpload);

        try {
            const response = await api.post('/notes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: config.visionTimeout // Use centralized config
            });
            setNotes(response.data.notes);
        } catch (err: any) {
             setError(err.response?.data?.error || err.message || 'Failed to process image');
        } finally {
            setIsPending(false);
        }
    };

    const handleCopy = () => {
        if (notes) {
            navigator.clipboard.writeText(notes);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                <div className="mb-4">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Convert Chaos to Notes
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Upload a photo of your whiteboard diagram or a messy handwritten page.
                        GhostPost will auto-transcribe it to clean MS OneNote markdown.
                    </p>
                </div>

                {/* Upload Zone */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                        ${dragActive ? 'border-primary bg-primary/10' : 'border-white/20 bg-black/40 hover:bg-black/60'}
                        ${isPending ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleChange}
                    />

                    {isPending ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin text-primary mb-3" size={32} />
                            <p className="text-sm font-medium text-gray-300">Synthesizing Notes via Vision API...</p>
                            <p className="text-xs text-gray-500 mt-1">This can take up to 20 seconds.</p>
                        </div>
                    ) : (
                        <>
                            {file ? (
                                <FileImage className="text-primary mb-3" size={32} />
                            ) : (
                                <Upload className="text-white/40 mb-3" size={32} />
                            )}
                            <p className="text-sm font-medium text-gray-300">
                                {file ? file.name : 'Click or drag image here'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
                        </>
                    )}
                </div>
                
                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>

            {/* Output Display */}
            {notes && (
                 <div className="glass rounded-3xl overflow-hidden flex flex-col mt-6">
                    <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-2">
                             <FileText size={16} className="text-blue-400" />
                             <h4 className="text-sm font-medium text-gray-400">OneNote Ready Markdown</h4>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check size={14} className="text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    Copy for OneNote
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-6 bg-black/20 text-gray-200 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {notes}
                    </div>
                </div>
            )}
        </div>
    );
}
