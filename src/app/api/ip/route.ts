import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // ทดสอบการเชื่อมต่อออกไปยัง external service เพื่อดู IP ที่ขาออก
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // เพิ่มข้อมูลเพิ่มเติม
    const result = {
      outboundIp: data.ip,
      timestamp: new Date().toISOString(),
      service: 'thailandpenthouses-api',
      region: process.env.GCP_REGION || 'asia-southeast1',
      project: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error getting outbound IP:', error);
    
    // ส่งข้อมูล error พร้อมข้อมูลพื้นฐาน
    const errorResult = {
      error: 'Failed to get outbound IP',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      service: 'thailandpenthouses-api',
      region: process.env.GCP_REGION || 'asia-southeast1',
      project: process.env.GCP_PROJECT_ID || 'sc-thailandpenthouses-uat',
    };

    return NextResponse.json(errorResult, { status: 500 });
  }
}

