import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Upload, Video, Image as ImageIcon, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onFilesUploaded, uploadedFiles = [], onRemoveFile, isMobile = false }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!window.cloudinary) {
            const script = document.createElement('script');
            script.src = 'https://upload-widget.cloudinary.com/global/all.js';
            script.onload = () => console.log('✅ Cloudinary script loaded');
            document.head.appendChild(script);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            streamRef.current = stream;
            setShowCamera(true);

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error);
                }
            }, 100);

        } catch (error) {
            console.error('Camera access error:', error);
            alert('Unable to access camera: ' + error.message);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
        setIsRecording(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            await uploadFile(file, 'image');
            stopCamera();
        }, 'image/jpeg');
    };

    const startRecording = () => {
        recordedChunks.current = [];
        const stream = streamRef.current;

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
            await uploadFile(file, 'video');
            stopCamera();
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const uploadFile = async (file, resourceType) => {
        setIsUploading(true);
        setUploadProgress('Uploading...');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'Unsigned');

            const response = await fetch(`https://api.cloudinary.com/v1_1/dbthcwwfe/${resourceType}/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.secure_url) {
                const fileInfo = {
                    name: file.name,
                    url: data.secure_url,
                    publicId: data.public_id,
                    size: file.size,
                    type: resourceType,
                    format: data.format,
                    cloudinaryData: data
                };
                onFilesUploaded([fileInfo]);
                setUploadProgress('Success!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload. Please try again.');
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadProgress(''), 2000);
        }
    };

    const handleCloudinaryUpload = () => {
        if (!window.cloudinary) return alert('Loading...');

        const widget = window.cloudinary.createUploadWidget({
            cloudName: 'dbthcwwfe',
            uploadPreset: 'Unsigned',
            multiple: true,
            maxFiles: 10,
            sources: ['local', 'camera'],
            resourceType: 'auto',
            styles: {
                palette: {
                    window: "#FFFFFF",
                    windowBorder: "#90A0B3",
                    tabIcon: "#0ea5e9",
                    menuIcons: "#5A616A",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#0ea5e9",
                    action: "#FF620C",
                    inactiveTabIcon: "#0E2F5A",
                    error: "#F44235",
                    inProgress: "#0078FF",
                    complete: "#20B832",
                    sourceBg: "#E4EBF1"
                }
            }
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                const fileInfo = {
                    name: result.info.original_filename || 'Uploaded file',
                    url: result.info.secure_url,
                    publicId: result.info.public_id,
                    size: result.info.bytes,
                    type: result.info.resource_type,
                    format: result.info.format,
                    cloudinaryData: result.info
                };
                onFilesUploaded([fileInfo]);
            }
        });

        widget.open();
    };

    return (
        <div className="w-full">
            <AnimatePresence>
                {showCamera && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <div className="bg-black/50 p-4 flex justify-between items-center backdrop-blur-sm">
                            <h3 className="text-white font-medium">
                                {isRecording ? 'Recording...' : 'Take Photo/Video'}
                            </h3>
                            <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="bg-black/80 p-6 flex justify-center items-center gap-8 pb-12">
                            {!isRecording ? (
                                <>
                                    <button onClick={capturePhoto}
                                        className="w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/20 transition-all flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white rounded-full"></div>
                                    </button>
                                    <button onClick={startRecording}
                                        className="w-12 h-12 rounded-full border-4 border-red-500 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                                    </button>
                                </>
                            ) : (
                                <button onClick={stopRecording} className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center relative">
                                    <div className="w-8 h-8 bg-red-500 rounded-lg animate-pulse"></div>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={startCamera}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-paper border border-secondary/20 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium text-dark">Camera</span>
                </button>

                <button
                    onClick={handleCloudinaryUpload}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-paper border border-secondary/20 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Upload className="w-6 h-6 text-primary-dark" />
                    <span className="text-sm font-medium text-dark">Upload</span>
                </button>
            </div>

            {isUploading && (
                <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-secondary">{uploadProgress}</p>
                </div>
            )}

            {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-paper border border-secondary/10 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary/10 rounded-lg">
                                    {file.type === 'video' ? <Video size={18} className="text-secondary" /> : <ImageIcon size={18} className="text-secondary" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-dark truncate max-w-[150px]">{file.name}</p>
                                    <p className="text-xs text-secondary/70">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                            </div>
                            <button onClick={() => onRemoveFile && onRemoveFile(index)} className="p-2 text-secondary/50 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
