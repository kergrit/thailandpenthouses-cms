'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EmailTestResult {
  success: boolean;
  message: string;
  messageId?: string;
  response?: string;
  timestamp: string;
  outboundIp: string;
  smtpConfig?: {
    host: string;
    port: string;
    secure: boolean;
    user: string;
    fromName: string;
    fromEmail: string;
  };
}

interface EmailTestError {
  error: string;
  message: string;
  timestamp: string;
  outboundIp: string;
}

export default function EmailTestPage() {
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Subject',
    message: 'Test Message',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: 'false',
    fromName: '',
    fromEmail: ''
  });

  const [result, setResult] = useState<EmailTestResult | null>(null);
  const [error, setError] = useState<EmailTestError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError({
        error: 'Network Error',
        message: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        outboundIp: 'Unknown'
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Test POC
            </h1>
            <p className="text-gray-600">
              ทดสอบการส่งอีเมลผ่าน SMTP configuration ต่างๆ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">SMTP Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    name="smtpHost"
                    value={formData.smtpHost}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="smtp.office365.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port *
                    </label>
                    <input
                      type="number"
                      name="smtpPort"
                      value={formData.smtpPort}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secure
                    </label>
                    <select
                      name="smtpSecure"
                      value={formData.smtpSecure}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="false">No (STARTTLS)</option>
                      <option value="true">Yes (SSL/TLS)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Username *
                  </label>
                  <input
                    type="text"
                    name="smtpUser"
                    value={formData.smtpUser}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="your-email@domain.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Password *
                  </label>
                  <input
                    type="password"
                    name="smtpPassword"
                    value={formData.smtpPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Your SMTP password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      name="fromName"
                      value={formData.fromName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="Your Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      name="fromEmail"
                      value={formData.fromEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="from@domain.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Email Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Email *
                  </label>
                  <input
                    type="email"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Email...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results */}
          {result && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Email Sent Successfully!
              </h3>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-800"><strong className="text-gray-900">Message ID:</strong> <span className="text-gray-700">{result.messageId}</span></p>
                <p className="text-gray-800"><strong className="text-gray-900">Response:</strong> <span className="text-gray-700">{result.response}</span></p>
                <p className="text-gray-800"><strong className="text-gray-900">Outbound IP:</strong> <span className="text-gray-700">{result.outboundIp}</span></p>
                <p className="text-gray-800"><strong className="text-gray-900">Timestamp:</strong> <span className="text-gray-700">{new Date(result.timestamp).toLocaleString('th-TH')}</span></p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Email Sending Failed
              </h3>
              
              <div className="space-y-2 text-sm">
                <p><strong>Error:</strong> {error.error}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Outbound IP:</strong> {error.outboundIp}</p>
                <p><strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString('th-TH')}</p>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Information
            </h3>
            
            <div className="space-y-2 text-sm text-blue-700">
              <p><strong>Outbound IP:</strong> 34.143.169.232 (UAT) / 34.124.223.37 (PRD)</p>
              <p><strong>SMTP Ports:</strong> 25 (Standard), 587 (STARTTLS), 465 (SSL/TLS)</p>
              <p><strong>Office 365:</strong> smtp.office365.com:587 (STARTTLS)</p>
              <p><strong>Gmail:</strong> smtp.gmail.com:587 (STARTTLS)</p>
              <p><strong>Security:</strong> Use app passwords for Gmail, enable 2FA first</p>
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
