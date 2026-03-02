import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { 
    Camera, 
    X, 
    Scan, 
    CheckCircle, 
    AlertCircle,
    Smartphone,
    Monitor
} from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose, isOpen = false }) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [lastScan, setLastScan] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [manualCode, setManualCode] = useState('');

    // Initialize camera when scanner opens
    useEffect(() => {
        if (isOpen && isScanning) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [isOpen, isScanning]);

    const startCamera = async () => {
        try {
            setError(null);
            
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access is not supported in this browser');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                
                // Start scanning simulation (in real app, you'd use a barcode library like QuaggaJS)
                startBarcodeDetection();
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError('Unable to access camera. Please check permissions or try manual entry.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Simulate barcode detection (in real implementation, use QuaggaJS or similar)
    const startBarcodeDetection = () => {
        // This is a simulation - in real app, integrate with QuaggaJS or ZXing
        const simulateDetection = () => {
            // Simulate random barcode detection for demo
            if (Math.random() > 0.98 && isScanning) { // 2% chance per frame
                const mockBarcode = generateMockBarcode();
                handleBarcodeDetected(mockBarcode);
            }
        };

        const interval = setInterval(simulateDetection, 100);
        return () => clearInterval(interval);
    };

    const generateMockBarcode = () => {
        const mockBarcodes = [
            '1234567890123',
            '9876543210987',
            '5555666677778',
            '1111222233334',
            '9999888877776'
        ];
        return mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    };

    const handleBarcodeDetected = (code) => {
        setLastScan(code);
        setScanHistory(prev => [
            { code, timestamp: new Date(), type: 'barcode' },
            ...prev.slice(0, 4) // Keep last 5 scans
        ]);
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Call parent callback
        if (onScan) {
            onScan(code, 'barcode');
        }
    };

    const handleManualEntry = () => {
        if (manualCode.trim()) {
            handleBarcodeDetected(manualCode.trim());
            setManualCode('');
        }
    };

    const handleQRCodeScan = () => {
        // Simulate QR code scan
        const qrData = JSON.stringify({
            type: 'medicine',
            id: Math.floor(Math.random() * 1000),
            name: 'Sample Medicine',
            batch: 'BATCH' + Math.floor(Math.random() * 1000)
        });
        
        setLastScan(qrData);
        setScanHistory(prev => [
            { code: qrData, timestamp: new Date(), type: 'qr' },
            ...prev.slice(0, 4)
        ]);

        if (onScan) {
            onScan(qrData, 'qr');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                            <Scan className="w-5 h-5 mr-2" />
                            Barcode & QR Scanner
                        </CardTitle>
                        <Button onClick={onClose} variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Camera Controls */}
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => setIsScanning(!isScanning)}
                            className={isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            {isScanning ? 'Stop Camera' : 'Start Camera'}
                        </Button>
                        
                        <Button onClick={handleQRCodeScan} variant="outline">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Simulate QR Scan
                        </Button>
                    </div>

                    {/* Camera View */}
                    {isScanning && (
                        <div className="relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                            />
                            
                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="border-2 border-red-500 w-48 h-32 rounded-lg animate-pulse">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-4 left-4 right-4 text-center">
                                <p className="text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
                                    Position barcode within the frame
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}

                    {/* Manual Entry */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Manual Entry</h4>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Enter barcode manually"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                            />
                            <Button onClick={handleManualEntry} disabled={!manualCode.trim()}>
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Last Scan Result */}
                    {lastScan && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3 flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                Last Scan Result
                            </h4>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <code className="text-green-800 font-mono text-sm break-all">
                                    {lastScan}
                                </code>
                            </div>
                        </div>
                    )}

                    {/* Scan History */}
                    {scanHistory.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Recent Scans</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {scanHistory.map((scan, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                        <div className="flex items-center">
                                            {scan.type === 'qr' ? (
                                                <Smartphone className="w-4 h-4 text-blue-600 mr-2" />
                                            ) : (
                                                <Monitor className="w-4 h-4 text-green-600 mr-2" />
                                            )}
                                            <code className="font-mono text-xs">
                                                {scan.code.length > 20 ? scan.code.substring(0, 20) + '...' : scan.code}
                                            </code>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            {scan.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="border-t pt-4 text-sm text-gray-600">
                        <h4 className="font-medium mb-2">Instructions:</h4>
                        <ul className="space-y-1 text-xs">
                            <li>• Click "Start Camera" to begin scanning</li>
                            <li>• Position barcode within the red frame</li>
                            <li>• Use "Manual Entry" if camera is not available</li>
                            <li>• QR codes contain additional product information</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}