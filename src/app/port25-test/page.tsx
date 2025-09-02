'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Port25TestResult {
  success: boolean;
  message: string;
  details: {
    localAddress?: string;
    remoteAddress?: string;
    host?: string;
    port?: number;
    connectionType?: string;
    serverResponse?: string;
    smtpCapabilities?: {
      server: string;
      features: string[];
    };
    error?: {
      code: string;
      message: string;
      type: string;
    };
    suggestion?: string;
    recommendation?: string;
  };
  timestamp: string;
  project: string;
}

export default function Port25TestPage() {
  const [testResult, setTestResult] = useState<Port25TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPort25Connection = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-port25');
      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔌 Port 25 Connection Test
          </h1>
          <p className="text-xl text-gray-600">
            ทดสอบการเชื่อมต่อ Port 25 ไปยัง Office 365 SMTP Server
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Target: scasset-com.mail.protection.outlook.com:25
          </p>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={testPort25Connection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-200"
          >
            {isLoading ? '🔄 Testing...' : '🚀 Test Port 25 Connection'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Result Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Test Results
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={getStatusColor(testResult.success)}>
                    {getStatusIcon(testResult.success)}
                  </span>
                  <span className={`font-medium ${getStatusColor(testResult.success)}`}>
                    {testResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {testResult.message}
              </p>
            </div>

            {/* Result Details */}
            <div className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Connection Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span className="font-medium">{testResult.project}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="font-medium">
                        {new Date(testResult.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {testResult.details.host && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Host:</span>
                        <span className="font-medium">{testResult.details.host}</span>
                      </div>
                    )}
                    {testResult.details.port && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Port:</span>
                        <span className="font-medium">{testResult.details.port}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Network Info</h3>
                  <div className="space-y-2">
                    {testResult.details.localAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Local Address:</span>
                        <span className="font-medium">{testResult.details.localAddress}</span>
                      </div>
                    )}
                    {testResult.details.remoteAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remote Address:</span>
                        <span className="font-medium">{testResult.details.remoteAddress}</span>
                      </div>
                    )}
                    {testResult.details.connectionType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connection Type:</span>
                        <span className="font-medium">{testResult.details.connectionType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Server Response */}
              {testResult.details.serverResponse && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Server Response</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {testResult.details.serverResponse}
                    </pre>
                  </div>
                </div>
              )}

              {/* SMTP Capabilities */}
              {testResult.details.smtpCapabilities && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">SMTP Capabilities</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="text-gray-600">Server:</span>
                      <span className="ml-2 font-medium">
                        {testResult.details.smtpCapabilities.server}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Features:</span>
                      <ul className="mt-2 space-y-1">
                        {testResult.details.smtpCapabilities.features.map((feature, index) => (
                          <li key={index} className="ml-4 text-sm text-gray-800">
                            • {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {testResult.details.error && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-red-900 mb-3">Error Details</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-600">Error Code:</span>
                        <span className="font-medium text-red-800">{testResult.details.error.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Error Type:</span>
                        <span className="font-medium text-red-800">{testResult.details.error.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Message:</span>
                        <span className="font-medium text-red-800">{testResult.details.error.message}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {testResult.details.suggestion && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Suggestion</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800">{testResult.details.suggestion}</p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {testResult.details.recommendation && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-green-900 mb-3">🎯 Recommendation</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-green-800">{testResult.details.recommendation}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <button
                  onClick={testPort25Connection}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  🔄 Test Again
                </button>
                <Link
                  href="/"
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  🏠 Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">ℹ️ About Port 25 Test</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              การทดสอบนี้จะตรวจสอบการเชื่อมต่อ Port 25 ไปยัง Office 365 SMTP server 
              เพื่อยืนยันว่า Cloud Run service สามารถส่งอีเมลผ่าน SMTP ได้หรือไม่
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Port 25 มักถูกบล็อกโดย Google Cloud โดยค่าเริ่มต้น</li>
                <li>• แนะนำให้ใช้ Port 587 (STARTTLS) หรือ Port 465 (SSL/TLS) แทน</li>
                <li>• Office 365 แนะนำให้ใช้ Port 587 สำหรับการส่งอีเมล</li>
                <li>• การทดสอบนี้จะช่วยระบุปัญหาการเชื่อมต่อที่อาจเกิดขึ้น</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
