import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // ทดสอบการเชื่อมต่อออกไปยัง external service เพื่อดู IP ที่ขาออก
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ThailandPenthouses-CMS/1.0',
      },
      // เพิ่ม timeout
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // ตรวจสอบ IP ที่คาดหวัง
    const expectedIps = {
      'sc-thailandpenthouses-uat': '34.143.169.232',
      'sc-thailandpenthouses-prd': '34.124.223.37'
    };
    
    const currentProject = process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat';
    const expectedIp = expectedIps[currentProject as keyof typeof expectedIps];
    const isExpectedIp = expectedIp === data.ip;
    
    // เพิ่มข้อมูลเพิ่มเติม
    const result = {
      outboundIp: data.ip,
      expectedIp: expectedIp,
      isExpectedIp: isExpectedIp,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      service: 'thailandpenthouses-cms',
      region: process.env.GCP_REGION || 'asia-southeast1',
      project: currentProject,
      environment: currentProject.includes('uat') ? 'UAT' : currentProject.includes('prd') ? 'Production' : 'Unknown',
      userAgent: 'ThailandPenthouses-CMS/1.0',
      apiSource: 'https://api.ipify.org',
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error getting outbound IP:', error);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // ส่งข้อมูล error พร้อมข้อมูลพื้นฐาน
    const errorResult = {
      error: 'Failed to get outbound IP',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      service: 'thailandpenthouses-cms',
      region: process.env.GCP_REGION || 'asia-southeast1',
      project: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
      environment: (process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat').includes('uat') ? 'UAT' : 'Production',
      apiSource: 'https://api.ipify.org',
    };

    return NextResponse.json(errorResult, { status: 500 });
  }
}

