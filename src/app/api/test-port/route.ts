import { NextResponse } from 'next/server';
import { Socket } from 'net';

interface TestResult {
  success: boolean;
  message: string;
  details: {
    host: string;
    port: number;
    myIPAddress: string;
    localAddress: string;
    remoteAddress: string;
    connectionType: string;
    serverResponse: string;
    smtpCapabilities: string[];
    errorDetails: {
      code: string;
      message: string;
      syscall: string;
    } | null;
    suggestions: string[];
  };
}

async function testConnection(host: string, port: number): Promise<TestResult> {
  return new Promise(async (resolve) => {
    const socket = new Socket();
    
    // Get public IP address
    let publicIP = 'Unknown';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      publicIP = data.ip;
    } catch {
      // Fallback to alternative service
      try {
        const response = await fetch('https://httpbin.org/ip');
        const data = await response.json();
        publicIP = data.origin;
      } catch {
        publicIP = 'Unable to fetch';
      }
    }
    
    const result: TestResult = {
      success: false,
      message: '',
      details: {
        host: host,
        port: port,
        myIPAddress: publicIP,
        localAddress: '',
        remoteAddress: '',
        connectionType: '',
        serverResponse: '',
        smtpCapabilities: [],
        errorDetails: null,
        suggestions: []
      }
    };

    // Set timeout
    const timeout = setTimeout(() => {
      socket.destroy();
      result.message = 'Connection timeout';
      result.details.suggestions = [
        'Check if the host is reachable',
        'Verify the port is open and accessible',
        'Check firewall settings',
        'Try a different port (587, 465 for SMTP)'
      ];
      resolve(result);
    }, 10000); // 10 seconds timeout

    socket.on('connect', () => {
      clearTimeout(timeout);
      
      // Get connection details
      const localAddress = socket.localAddress;
      const localPort = socket.localPort;
      const remoteAddress = socket.remoteAddress;
      const remotePort = socket.remotePort;
      
      result.success = true;
      result.message = `Successfully connected to ${host}:${port}`;
      result.details.localAddress = `${localAddress}:${localPort}`;
      result.details.remoteAddress = `${remoteAddress}:${remotePort}`;
      result.details.connectionType = 'TCP';
      
      // Send EHLO for SMTP ports
      if (port === 25 || port === 587 || port === 465) {
        socket.write('EHLO test.com\r\n');
        
        let response = '';
        socket.on('data', (data) => {
          response += data.toString();
          
          // Check if we have a complete response
          if (response.includes('\r\n')) {
            const lines = response.split('\r\n').filter(line => line.trim());
            result.details.serverResponse = lines.join('\n');
            
            // Parse SMTP capabilities
            if (port === 25 || port === 587 || port === 465) {
              result.details.smtpCapabilities = parseSMTPCapabilities(lines);
            }
            
            socket.destroy();
            resolve(result);
          }
        });
      } else {
        // For non-SMTP ports, just close the connection
        socket.destroy();
        resolve(result);
      }
    });

    socket.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      result.message = `Connection failed: ${err.message}`;
      result.details.errorDetails = {
        code: err.code || 'UNKNOWN',
        message: err.message,
        syscall: err.syscall || 'unknown'
      };
      
      // Provide specific suggestions based on error
      if (err.code === 'ECONNREFUSED') {
        result.details.suggestions = [
          'The server is not listening on this port',
          'Check if the service is running',
          'Verify the port number is correct'
        ];
      } else if (err.code === 'ENOTFOUND') {
        result.details.suggestions = [
          'Hostname could not be resolved',
          'Check DNS configuration',
          'Verify the hostname is correct'
        ];
      } else if (err.code === 'ETIMEDOUT') {
        result.details.suggestions = [
          'Connection timed out',
          'Check network connectivity',
          'Verify firewall settings'
        ];
      } else {
        result.details.suggestions = [
          'Check network connectivity',
          'Verify host and port are correct',
          'Check firewall and security settings'
        ];
      }
      
      resolve(result);
    });

    // Connect to the host and port
    socket.connect(port, host);
  });
}

function parseSMTPCapabilities(lines: string[]): string[] {
  const capabilities: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('250-') || line.startsWith('250 ')) {
      const capability = line.replace(/^250-?\s*/, '').trim();
      if (capability && !capability.includes(' ')) {
        capabilities.push(capability);
      }
    }
  }
  
  return capabilities;
}

export async function GET() {
  // Get public IP address
  let publicIP = 'Unknown';
      try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      publicIP = data.ip;
    } catch {
      // Fallback to alternative service
      try {
        const response = await fetch('https://httpbin.org/ip');
        const data = await response.json();
        publicIP = data.origin;
      } catch {
        publicIP = 'Unable to fetch';
      }
    }

  return NextResponse.json({
    success: true,
    message: 'Port test API is working',
    details: {
      host: 'scasset-com.mail.protection.outlook.com',
      port: 25,
      myIPAddress: publicIP,
      status: 'API endpoint ready'
    },
    timestamp: new Date().toISOString(),
    project: process.env.GCP_PROJECT_ID || 'local-development'
  });
}

export async function POST(request: Request) {
  try {
    const { host, port } = await request.json();
    
    // Validate input
    if (!host || !port) {
      return NextResponse.json({
        success: false,
        message: 'Host and port are required',
        details: { suggestion: 'Please provide both host and port values' }
      }, { status: 400 });
    }
    
    // Validate port range
    if (port < 1 || port > 65535) {
      return NextResponse.json({
        success: false,
        message: 'Invalid port number',
        details: { suggestion: 'Port must be between 1 and 65535' }
      }, { status: 400 });
    }

    // Test the actual connection
    const testResult = await testConnection(host, parseInt(port));
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      timestamp: new Date().toISOString(),
      project: process.env.GCP_PROJECT_ID || 'local-development'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Invalid request format',
      details: { 
        suggestion: 'Please send valid JSON with host and port',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 400 });
  }
}
