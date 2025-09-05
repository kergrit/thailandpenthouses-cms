'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface IpCheckResult {
  outboundIp: string;
  expectedIp: string;
  isExpectedIp: boolean;
  responseTime: number;
  timestamp: string;
  service: string;
  region: string;
  project: string;
  environment: string;
  userAgent: string;
  apiSource: string;
}

interface IpCheckError {
  error: string;
  message: string;
  responseTime: number;
  timestamp: string;
  service: string;
  region: string;
  project: string;
  environment: string;
  apiSource: string;
}

export default function IpCheckPage() {
  const [result, setResult] = useState<IpCheckResult | null>(null);
  const [error, setError] = useState<IpCheckError | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkIp = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ip');
      const data = await response.json();

      if (!response.ok) {
        setError(data);
      } else {
        setResult(data);
        setLastChecked(new Date().toLocaleString('th-TH'));
      }
    } catch (err) {
      setError({
        error: 'Network Error',
        message: err instanceof Error ? err.message : 'Unknown error',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        service: 'thailandpenthouses-cms',
        region: 'asia-southeast1',
        project: 'sc-thailandpenthouses-uat',
        environment: 'UAT',
        apiSource: 'https://api.ipify.org',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-check on page load
    checkIp();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Cloud Run Outbound IP Check
            </h1>
            <p className="text-gray-600">
              ตรวจสอบ IP address ที่ออกจาก Cloud Run service ผ่าน{' '}
              <a 
                href="https://api.ipify.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                api.ipify.org
              </a>
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={checkIp}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  ตรวจสอบ IP ใหม่
                </>
              )}
            </button>
            
            {lastChecked && (
              <p className="text-sm text-gray-500 mt-2">
                ตรวจสอบล่าสุด: {lastChecked}
              </p>
            )}
          </div>

          {result && (
            <div className={`border rounded-lg p-4 mb-6 ${
              result.isExpectedIp 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                result.isExpectedIp ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {result.isExpectedIp ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                ผลการตรวจสอบ IP
                {result.isExpectedIp ? ' (ถูกต้อง)' : ' (ไม่ตรงกับที่คาดหวัง)'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Outbound IP Address</label>
                  <p className={`text-xl font-mono font-bold break-all ${
                    result.isExpectedIp ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {result.outboundIp}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Expected IP</label>
                  <p className="text-lg font-mono font-semibold text-gray-800">
                    {result.expectedIp}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Environment</label>
                  <p className="text-lg font-semibold text-gray-800">
                    {result.environment}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Response Time</label>
                  <p className="text-lg font-semibold text-gray-800">
                    {result.responseTime}ms
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Service</label>
                  <p className="text-lg font-semibold text-gray-800">
                    {result.service}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Region</label>
                  <p className="text-lg font-semibold text-gray-800">
                    {result.region}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Project</label>
                  <p className="text-sm text-gray-700 break-all">
                    {result.project}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">API Source</label>
                  <p className="text-sm text-gray-700">
                    <a href={result.apiSource} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {result.apiSource}
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="mt-4 bg-white p-3 rounded border">
                <label className="text-sm font-medium text-gray-600">Timestamp</label>
                <p className="text-sm text-gray-700">
                  {new Date(result.timestamp).toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เกิดข้อผิดพลาด
              </h2>
              
              <div className="bg-white p-3 rounded border">
                <label className="text-sm font-medium text-gray-600">Error</label>
                <p className="text-lg font-semibold text-red-600">
                  {error.error}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border mt-2">
                <label className="text-sm font-medium text-gray-600">Message</label>
                <p className="text-sm text-gray-700">
                  {error.message}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Response Time</label>
                  <p className="text-sm text-gray-700">
                    {error.responseTime}ms
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-sm font-medium text-gray-600">Environment</label>
                  <p className="text-sm text-gray-700">
                    {error.environment}
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border mt-2">
                <label className="text-sm font-medium text-gray-600">Timestamp</label>
                <p className="text-sm text-gray-700">
                  {new Date(error.timestamp).toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              ข้อมูลเพิ่มเติม
            </h3>
            
            <div className="space-y-2 text-sm text-blue-700">
              <p>
                <strong>UAT Project:</strong> IP ที่คาดหวังคือ <code className="bg-blue-100 px-1 rounded">34.143.169.232</code>
              </p>
              <p>
                <strong>PRD Project:</strong> IP ที่คาดหวังคือ <code className="bg-blue-100 px-1 rounded">34.124.223.37</code>
              </p>
              <p>
                <strong>API Endpoint:</strong> <code className="bg-blue-100 px-1 rounded">/api/ip</code>
              </p>
              <p>
                <strong>External Service:</strong> <a href="https://api.ipify.org" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">api.ipify.org</a>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-blue-500 hover:underline"
            >
              ← กลับไปหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
