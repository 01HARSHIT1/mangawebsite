import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Helper functions (assume these are implemented elsewhere or below)
// calculatePerformanceScore, getPerformanceGrade, updatePerformanceStats, checkPerformanceAlerts, getPerformanceStats

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pageLoadTime,
      domContentLoaded,
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay,
      cumulativeLayoutShift,
      url,
      userAgent,
      timestamp,
      userId,
      sessionData,
    } = body;

    const { db } = await connectToDatabase();

    // Calculate performance score
    const performanceScore = calculatePerformanceScore({
      pageLoadTime,
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay,
      cumulativeLayoutShift,
    });

    // Determine performance grade
    const performanceGrade = getPerformanceGrade(performanceScore);

    // Create performance log
    const performanceLog = {
      pageLoadTime,
      domContentLoaded,
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay,
      cumulativeLayoutShift,
      url,
      userAgent,
      timestamp,
      userId,
      sessionData,
      performanceScore,
      performanceGrade,
      createdAt: new Date(),
    };

    // Store in database
    await db.collection('performance_logs').insertOne(performanceLog);

    // Update performance statistics
    await updatePerformanceStats(performanceLog);

    // Check for performance alerts
    await checkPerformanceAlerts(performanceLog);

    return NextResponse.json({
      success: true,
      performanceScore,
      performanceGrade,
      message: 'Performance metrics logged successfully',
    });
  } catch (error) {
    console.error('Error logging performance metrics:', error);
    return NextResponse.json({
      error: 'Failed to log performance metrics',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const url = searchParams.get('url');
    const grade = searchParams.get('grade');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { db } = await connectToDatabase();

    // Build filter
    const filter: any = {};
    if (url) filter.url = { $regex: url, $options: 'i' };
    if (grade) filter.performanceGrade = grade;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get performance logs with pagination
    const skip = (page - 1) * limit;
    const logs = await db.collection('performance_logs')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const total = await db.collection('performance_logs').countDocuments(filter);

    // Get performance statistics
    const stats = await getPerformanceStats();

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching performance logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch performance logs',
    }, { status: 500 });
  }
}

function calculatePerformanceScore(metrics: any): number {
  const weights = {
    pageLoadTime: 0.25,
    firstContentfulPaint: 0.25,
    largestContentfulPaint: 0.25,
    firstInputDelay: 0.15,
    cumulativeLayoutShift: 0.10,
  };
  let score = 0;
  // Page Load Time (0-100)
  if (metrics.pageLoadTime <= 1000) score += weights.pageLoadTime * 100;
  else if (metrics.pageLoadTime <= 2000) score += weights.pageLoadTime * 80;
  else if (metrics.pageLoadTime <= 3000) score += weights.pageLoadTime * 60;
  else if (metrics.pageLoadTime <= 4000) score += weights.pageLoadTime * 40;
  else score += weights.pageLoadTime * 20;
  // First Contentful Paint (0-100)
  if (metrics.firstContentfulPaint <= 1000) score += weights.firstContentfulPaint * 100;
  else if (metrics.firstContentfulPaint <= 1800) score += weights.firstContentfulPaint * 80;
  else if (metrics.firstContentfulPaint <= 3000) score += weights.firstContentfulPaint * 60;
  else score += weights.firstContentfulPaint * 40;
  // Largest Contentful Paint (0-100)
  if (metrics.largestContentfulPaint <= 2500) score += weights.largestContentfulPaint * 100;
  else if (metrics.largestContentfulPaint <= 4000) score += weights.largestContentfulPaint * 80;
  else if (metrics.largestContentfulPaint <= 6000) score += weights.largestContentfulPaint * 60;
  else score += weights.largestContentfulPaint * 40;
  // First Input Delay (0-100)
  if (metrics.firstInputDelay <= 100) score += weights.firstInputDelay * 100;
  else if (metrics.firstInputDelay <= 300) score += weights.firstInputDelay * 80;
  else if (metrics.firstInputDelay <= 500) score += weights.firstInputDelay * 60;
  else score += weights.firstInputDelay * 40;
  // Cumulative Layout Shift (0-100)
  if (metrics.cumulativeLayoutShift <= 0.1) score += weights.cumulativeLayoutShift * 100;
  else if (metrics.cumulativeLayoutShift <= 0.25) score += weights.cumulativeLayoutShift * 80;
  else if (metrics.cumulativeLayoutShift <= 0.5) score += weights.cumulativeLayoutShift * 60;
  else score += weights.cumulativeLayoutShift * 40;
  return Math.round(score);
}

function getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Dummy implementations for demonstration
async function updatePerformanceStats(performanceLog: any) {
  // Implement as needed
}

async function checkPerformanceAlerts(performanceLog: any) {
  // Implement as needed
}

async function getPerformanceStats() {
  // Dummy implementation
  return {};
} 