import { NextResponse } from 'next/server';
import net from 'net';

export async function GET() {
  const host = 'scasset-com.mail.protection.outlook.com';
  const port = 25;
  
  return new Promise<NextResponse>((resolve) => {
    const client = new net.Socket();
    const result: {
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
    } = {
      success: false,
      message: '',
      details: {},
      timestamp: new Date().toISOString(),
      project: process.env.GCP_PROJECT_ID || 'local-development'
    };
    
    const timeout = setTimeout(() => {
      if (!client.destroyed) {
        client.destroy();
        result.message = 'Connection timeout after 10 seconds';
        result.details.suggestion = 'Port 25 may be blocked by Google Cloud or network policies';
        resolve(NextResponse.json(result, { status: 408 }));
      }
    }, 10000);
    
    client.connect(port, host, () => {
      clearTimeout(timeout);
      result.success = true;
      result.message = 'Port 25 connection successful!';
      result.details = {
        localAddress: `${client.localAddress}:${client.localPort}`,
        remoteAddress: `${client.remoteAddress}:${client.remotePort}`,
        host: host,
        port: port,
        connectionType: 'TCP Socket'
      };
      
      // ส่ง SMTP greeting
      client.write('EHLO test.example.com\r\n');
    });
    
    client.on('data', (data) => {
      result.details.serverResponse = data.toString().trim();
      result.details.smtpCapabilities = parseSMTPCapabilities(data.toString());
      
      // ปิดการเชื่อมต่อหลังจากได้รับ response
      setTimeout(() => {
        client.end();
      }, 1000);
    });
    
    client.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      result.message = `Port 25 connection failed: ${err.message}`;
      result.details.error = {
        code: err.code || 'UNKNOWN',
        message: err.message,
        type: err.constructor.name
      };
      
      // ให้คำแนะนำตาม error code
      if (err.code === 'ECONNREFUSED') {
        result.details.suggestion = 'Port 25 is blocked or not accessible. Try using port 587 or 465 instead.';
        result.details.recommendation = 'Use STARTTLS (port 587) or SSL/TLS (port 465) for Office 365';
      } else if (err.code === 'ETIMEDOUT') {
        result.details.suggestion = 'Connection timeout - check firewall rules and network policies';
        result.details.recommendation = 'Verify VPC firewall rules and Cloud NAT configuration';
      } else if (err.code === 'ENOTFOUND') {
        result.details.suggestion = 'Host not found - check DNS resolution';
        result.details.recommendation = 'Verify DNS settings and network connectivity';
      } else if (err.code === 'EACCES') {
        result.details.suggestion = 'Permission denied - check security policies';
        result.details.recommendation = 'Verify IAM permissions and security policies';
      } else {
        result.details.suggestion = 'Unknown connection error - check network configuration';
        result.details.recommendation = 'Review network settings and try alternative ports';
      }
      
      resolve(NextResponse.json(result, { status: 500 }));
    });
    
    client.on('close', () => {
      clearTimeout(timeout);
      if (result.success) {
        resolve(NextResponse.json(result, { status: 200 }));
      }
    });
  });
}

// ฟังก์ชันสำหรับ parse SMTP capabilities
function parseSMTPCapabilities(response: string): {
  server: string;
  features: string[];
} {
  const lines = response.split('\r\n').filter(line => line.trim());
  const capabilities: {
    server: string;
    features: string[];
  } = {
    server: '',
    features: []
  };
  
  lines.forEach((line, index) => {
    if (index === 0) {
      // First line usually contains server info
      capabilities.server = line;
    } else if (line.startsWith('250-') || line.startsWith('250 ')) {
      // SMTP capabilities
      const feature = line.replace(/^250-?\s*/, '');
      if (feature) {
        capabilities.features.push(feature);
      }
    }
  });
  
  return capabilities;
}
