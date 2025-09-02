'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PortTestResult {
  success: boolean;
  message: string;
  details: {
    myIPAddress?: string;
    localAddress?: string;
    remoteAddress?: string;
    host?: string;
    port?: number;
    connectionType?: string;
    serverResponse?: string;
    smtpCapabilities?: string[];
    errorDetails?: {
      code: string;
      message: string;
      syscall: string;
    };
    suggestions?: string[];
  };
  timestamp: string;
  project: string;
}

export default function PortTestPage() {
  const [testResult, setTestResult] = useState<PortTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smtpHost, setSmtpHost] = useState('scasset-com.mail.protection.outlook.com');
  const [smtpPort, setSmtpPort] = useState('25');

  const testPortConnection = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-port', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: smtpHost,
          port: parseInt(smtpPort, 10)
        })
      });
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
            🔌 Port Connection Test
          </h1>
          <p className="text-xl text-gray-600">
            ทดสอบการเชื่อมต่อ Port ไปยัง Mail Server หรือ Service ต่างๆ
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Configure connection settings and test connectivity to any server
          </p>
        </div>

        {/* Port Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Connection Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="smtpHost" className="block text-base font-semibold text-gray-800 mb-2">
                Host / Server Address
              </label>
              <input
                type="text"
                id="smtpHost"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="Enter host address (e.g., smtp.office365.com)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium text-base"
              />
            </div>
            <div>
              <label htmlFor="smtpPort" className="block text-base font-semibold text-gray-800 mb-2">
                Port Number
              </label>
              <input
                type="number"
                id="smtpPort"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="25, 587, 465, 80, 443"
                min="1"
                max="65535"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium text-base"
              />
            </div>
          </div>
          
          {/* Quick Port Presets */}
          <div className="mb-4">
            <p className="text-base font-semibold text-gray-800 mb-3">Quick Port Presets:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSmtpPort('25')}
                className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Port 25 (SMTP)
              </button>
              <button
                onClick={() => setSmtpPort('587')}
                className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Port 587 (STARTTLS)
              </button>
              <button
                onClick={() => setSmtpPort('465')}
                className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Port 465 (SSL/TLS)
              </button>
              <button
                onClick={() => setSmtpPort('80')}
                className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Port 80 (HTTP)
              </button>
              <button
                onClick={() => setSmtpPort('443')}
                className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Port 443 (HTTPS)
              </button>
            </div>
          </div>
          
          {/* Test Button */}
          <div className="text-center">
            <button
              onClick={testPortConnection}
              disabled={isLoading || !smtpHost.trim() || !smtpPort.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-200"
            >
              {isLoading ? '🔄 Testing...' : `🚀 Test Connection to ${smtpHost}:${smtpPort}`}
            </button>
          </div>
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
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Project:</span>
                      <span className="text-gray-900 font-semibold">{testResult.project}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Timestamp:</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(testResult.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {testResult.details.host && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Host:</span>
                        <span className="text-gray-900 font-semibold">{testResult.details.host}</span>
                      </div>
                    )}
                    {testResult.details.port && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Port:</span>
                        <span className="text-gray-900 font-semibold">{testResult.details.port}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Network Info</h3>
                  <div className="space-y-3">
                    {testResult.details.myIPAddress && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <span className="text-blue-700 font-medium">My IP Address:</span>
                        <span className="text-blue-900 font-semibold">{testResult.details.myIPAddress}</span>
                      </div>
                    )}
                    {testResult.details.localAddress && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Local Address:</span>
                        <span className="text-gray-900 font-semibold">{testResult.details.localAddress}</span>
                      </div>
                    )}
                    {testResult.details.remoteAddress && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Remote Address:</span>
                        <span className="text-gray-900 font-semibold">{testResult.details.remoteAddress}</span>
                      </div>
                    )}
                    {testResult.details.connectionType && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Connection Type:</span>
                        <span className="text-gray-900 font-semibold">{testResult.details.connectionType}</span>
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
              {testResult.details.smtpCapabilities && testResult.details.smtpCapabilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">SMTP Capabilities</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="text-gray-600">Server:</span>
                      <span className="ml-2 font-medium">
                        {testResult.details.host}:{testResult.details.port}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Features:</span>
                      <ul className="mt-2 space-y-1">
                        {testResult.details.smtpCapabilities.map((feature, index) => (
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
              {testResult.details.errorDetails && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-red-900 mb-3">Error Details</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 px-3 bg-red-100 rounded-lg">
                        <span className="text-red-700 font-medium">Error Code:</span>
                        <span className="text-red-900 font-semibold">{testResult.details.errorDetails.code}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-red-100 rounded-lg">
                        <span className="text-red-700 font-medium">System Call:</span>
                        <span className="text-red-900 font-semibold">{testResult.details.errorDetails.syscall}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-red-100 rounded-lg">
                        <span className="text-red-700 font-medium">Message:</span>
                        <span className="text-red-900 font-semibold">{testResult.details.errorDetails.message}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {testResult.details.suggestions && testResult.details.suggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Suggestions</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {testResult.details.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-blue-800 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}



              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <button
                  onClick={testPortConnection}
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
          <h3 className="text-xl font-semibold text-gray-900 mb-4">ℹ️ About Port Connection Test</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              การทดสอบนี้จะตรวจสอบการเชื่อมต่อ Port ไปยัง Server หรือ Service ต่างๆ 
              เพื่อยืนยันว่า Cloud Run service สามารถเชื่อมต่อได้หรือไม่
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Port 25 มักถูกบล็อกโดย Google Cloud โดยค่าเริ่มต้น</li>
                <li>• แนะนำให้ใช้ Port 587 (STARTTLS) หรือ Port 465 (SSL/TLS) สำหรับ SMTP</li>
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
