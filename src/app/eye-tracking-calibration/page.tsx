'use client';

import { useEffect, useState } from 'react';

export default function EyeTrackingCalibrationPage() {
    const [status, setStatus] = useState<string>('Checking for calibration data...');
    const [calibrationData, setCalibrationData] = useState<any>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Automatically read from localStorage
        try {
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.calibrated && 
                    data.scrollUp?.samples?.length >= 5 &&
                    data.scrollDown?.samples?.length >= 5 &&
                    data.noScroll?.samples?.length >= 5) {
                    setCalibrationData(data);
                    setStatus('✅ Calibration data found!');
                    
                    // Automatically save to server
                    fetch('/api/eye-tracking/save-master-calibration', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    }).then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            setSaved(true);
                            setStatus('✅ Calibration data automatically saved to server!');
                        } else {
                            setStatus(`❌ Error: ${result.error}`);
                        }
                    }).catch(error => {
                        setStatus(`❌ Error saving: ${error.message}`);
                    });
                } else {
                    setStatus('⚠️ Calibration data found but incomplete. Please complete calibration first.');
                }
            } else {
                setStatus('❌ No calibration data found in localStorage. Please complete calibration first.');
            }
        } catch (error: any) {
            setStatus(`❌ Error reading data: ${error.message}`);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Eye Tracking Calibration Data</h1>
                
                <div className="bg-slate-800 rounded-lg p-6 mb-6">
                    <div className="text-lg mb-4">{status}</div>
                    
                    {saved && (
                        <div className="bg-green-900/50 border border-green-700 rounded p-4 mb-4">
                            <p className="text-green-400 font-semibold">✅ Success!</p>
                            <p className="text-sm text-gray-300 mt-2">
                                Your calibration data has been automatically saved to: <code className="bg-slate-900 px-2 py-1 rounded">data/master-calibration.json</code>
                            </p>
                            <p className="text-sm text-gray-300 mt-2">
                                The system will now automatically hardcode these values and remove the calibration UI.
                            </p>
                        </div>
                    )}
                    
                    {calibrationData && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-3">Calibration Data Summary:</h2>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-blue-400">Scroll Up:</span> {calibrationData.scrollUp.samples.length} samples, 
                                    mean: {calibrationData.scrollUp.mean?.toFixed(4)}, 
                                    stdDev: {calibrationData.scrollUp.stdDev?.toFixed(4)}
                                </div>
                                <div>
                                    <span className="text-green-400">Scroll Down:</span> {calibrationData.scrollDown.samples.length} samples, 
                                    mean: {calibrationData.scrollDown.mean?.toFixed(4)}, 
                                    stdDev: {calibrationData.scrollDown.stdDev?.toFixed(4)}
                                </div>
                                <div>
                                    <span className="text-yellow-400">No Scroll:</span> {calibrationData.noScroll.samples.length} samples, 
                                    mean: {calibrationData.noScroll.mean?.toFixed(4)}, 
                                    stdDev: {calibrationData.noScroll.stdDev?.toFixed(4)}
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">Raw Data (for verification):</h3>
                                <textarea
                                    readOnly
                                    value={JSON.stringify(calibrationData, null, 2)}
                                    className="w-full h-64 bg-slate-900 text-xs font-mono p-4 rounded border border-slate-700"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="bg-blue-900/30 border border-blue-700 rounded p-4">
                    <p className="text-sm">
                        <strong>Note:</strong> This page automatically reads your calibration data from localStorage and saves it to the server file. 
                        No console commands needed!
                    </p>
                </div>
            </div>
        </div>
    );
}

