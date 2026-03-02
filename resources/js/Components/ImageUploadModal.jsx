import React, { useState, useRef, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Camera, Upload, X, RotateCcw, ZoomIn, ZoomOut, Move, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ImageUploadModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess,
  title = "Update Profile Image",
  uploadRoute = "profile.avatar.upload",
  deleteRoute = "profile.avatar.delete"
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const uploadForm = useForm({
    avatar: null,
  });

  const deleteForm = useForm({});

  // Enhanced file validation
  const validateFile = useCallback((file) => {
    const errors = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('Please select an image file (JPG, PNG, GIF)');
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB');
    }
    
    // Check minimum dimensions (optional)
    return new Promise((resolve) => {
      if (errors.length > 0) {
        resolve(errors);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          errors.push('Image must be at least 100x100 pixels');
        }
        resolve(errors);
      };
      img.onerror = () => {
        errors.push('Invalid image file');
        resolve(errors);
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file selection with enhanced validation
  const handleFileSelect = async (file) => {
    if (!file) return;

    setValidationErrors([]);
    const errors = await validateFile(file);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSelectedFile(file);
    uploadForm.setData('avatar', file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setCropMode(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Reset all states
  const resetStates = () => {
    setSelectedFile(null);
    setPreview(null);
    setCropMode(false);
    setZoom(1);
    setRotation(0);
    setUploadProgress(0);
    setValidationErrors([]);
    uploadForm.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle modal close
  const handleClose = () => {
    resetStates();
    onClose();
  };

  // Handle upload
  const handleUpload = () => {
    if (!selectedFile) return;
    if (!user || !user.id) {
      console.error('User object or user ID is missing:', user);
      setValidationErrors(['User information is missing. Please try again.']);
      return;
    }

    setUploadProgress(0);
    
    uploadForm.post(route(uploadRoute, { user: user.id }), {
      onProgress: (progress) => {
        setUploadProgress(Math.round(progress.percentage || 0));
      },
      onSuccess: () => {
        setUploadProgress(100);
        setTimeout(() => {
          resetStates();
          onSuccess?.();
          onClose();
        }, 1000);
      },
      onError: (errors) => {
        console.error('Upload error:', errors);
        setUploadProgress(0);
        if (errors.avatar) {
          setValidationErrors([errors.avatar]);
        } else {
          setValidationErrors(['Upload failed. Please try again.']);
        }
      }
    });
  };

  // Handle delete avatar
  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this profile image?')) {
      return;
    }

    if (!user || !user.id) {
      console.error('User object or user ID is missing:', user);
      return;
    }

    deleteForm.delete(route(deleteRoute, { user: user.id }), {
      onSuccess: () => {
        resetStates();
        onSuccess?.();
        onClose();
      }
    });
  };

  // Get current avatar URL
  const getCurrentAvatarUrl = () => {
    if (user?.avatar_url) {
      return user.avatar_url;
    }
    return null;
  };

  return (
    <Modal show={isOpen} onClose={handleClose} maxWidth="2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Avatar Display */}
        {!preview && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Image</h4>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {getCurrentAvatarUrl() ? (
                  <img
                    src={getCurrentAvatarUrl()}
                    alt={user?.name || 'User'}
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center border-4 border-gray-200">
                    <span className="text-white text-2xl font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {getCurrentAvatarUrl() ? 'Custom profile image' : 'Default avatar'}
                </p>
                {getCurrentAvatarUrl() && (
                  <DangerButton
                    onClick={handleDelete}
                    disabled={deleteForm.processing}
                    className="mt-2"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteForm.processing ? 'Deleting...' : 'Remove Image'}
                  </DangerButton>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!preview && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Upload New Image</h4>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your image here, or{' '}
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports: JPG, PNG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview and Crop */}
        {preview && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview & Adjust</h4>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-xs max-h-64 rounded-lg shadow-lg"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>
              </div>

              {/* Image Controls */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  type="button"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <button
                  type="button"
                  onClick={() => setRotation((rotation - 90) % 360)}
                  className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  title="Rotate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Reset Preview */}
              <div className="text-center">
                <SecondaryButton
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    setCropMode(false);
                    setZoom(1);
                    setRotation(0);
                    uploadForm.reset();
                  }}
                  size="sm"
                >
                  Choose Different Image
                </SecondaryButton>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Upload Guidelines */}
        <div className="mb-6 p-4 bg-gradient-to-r from-accent-50 to-primary-50 border border-accent-200 rounded-lg">
          <h5 className="text-sm font-medium text-accent-900 mb-3 flex items-center">
            <Camera className="w-4 h-4 mr-2" />
            Image Guidelines
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div>
              <strong>Recommended:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Square images (1:1 ratio)</li>
                <li>• Minimum 200x200 pixels</li>
                <li>• Clear, well-lit photos</li>
              </ul>
            </div>
            <div>
              <strong>Requirements:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Maximum 5MB file size</li>
                <li>• JPG, PNG, or GIF format</li>
                <li>• Minimum 100x100 pixels</li>
              </ul>
            </div>
          </div>
          {selectedFile && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedFile ? (
              <span className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                Ready to upload
              </span>
            ) : (
              <span>Select an image to continue</span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <SecondaryButton 
              onClick={handleClose}
              disabled={uploadForm.processing || (uploadProgress > 0 && uploadProgress < 100)}
            >
              {uploadProgress === 100 ? 'Close' : 'Cancel'}
            </SecondaryButton>
            
            {selectedFile && uploadProgress !== 100 && (
              <PrimaryButton
                onClick={handleUpload}
                disabled={uploadForm.processing || validationErrors.length > 0 || (uploadProgress > 0 && uploadProgress < 100)}
                className="min-w-[120px]"
              >
                {uploadProgress > 0 && uploadProgress < 100 ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {uploadProgress}%
                  </>
                ) : uploadForm.processing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </>
                )}
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Enhanced Error Display */}
        {(validationErrors.length > 0 || uploadForm.errors.avatar) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Upload Error</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {uploadForm.errors.avatar && (
                    <li>• {uploadForm.errors.avatar}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <Upload className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-800">Uploading...</span>
              <span className="ml-auto text-sm text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadProgress === 100 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Upload Successful!</h4>
                <p className="text-sm text-green-600">Profile image has been updated.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}