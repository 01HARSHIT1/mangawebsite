import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Helper functions (assume these are implemented elsewhere or below)
// sendErrorReportEmail, logErrorReport

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      errorId,
      userEmail,
      userMessage,
      error,
      componentStack,
      url,
      timestamp,
      statusCode,
    } = body;

    const { db } = await connectToDatabase();

    // Create error report
    const errorReport = {
      errorId,
      userEmail,
      userMessage,
      error,
      componentStack,
      url,
      timestamp,
      statusCode,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      createdAt: new Date(),
      status: 'new',
    };

    // Store report in database
    const result = await db.collection('error_reports').insertOne(errorReport);

    // Send email notification to support team
    if (userEmail) {
      await sendErrorReportEmail(errorReport);
    }

    // Update error log if errorId is provided
    if (errorId) {
      await db.collection('error_logs').updateOne(
        { errorId },
        { $set: { hasUserReport: true, userReportId: result.insertedId } }
      );
    }

    // Log to monitoring service
    await logErrorReport(errorReport);

    return NextResponse.json({
      success: true,
      reportId: result.insertedId,
      message: 'Error report submitted successfully',
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json({ error: 'Failed to submit error report' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const { db } = await connectToDatabase();

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;

    // Get reports with pagination
    const skip = (page - 1) * limit;
    const reports = await db.collection('error_reports')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const total = await db.collection('error_reports').countDocuments(filter);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json({
      error: 'Failed to fetch error reports',
    }, { status: 500 });
  }
}

// Dummy implementations for demonstration
async function sendErrorReportEmail(errorReport: any) {
  try {
    // In a real application, use a proper email service (SendGrid, SES, etc.)
    const emailContent = `
New Error Report Received\n\nError ID: ${errorReport.errorId || 'N/A'}\nUser Email: ${errorReport.userEmail}\nStatus Code: ${errorReport.statusCode || 'N/A'}\nURL: ${errorReport.url}\nTimestamp: ${errorReport.timestamp}\n\nUser Message:\n${errorReport.userMessage || 'No message provided'}\n\nError Details:\n${errorReport.error || 'No error details'}\n\nComponent Stack:\n${errorReport.componentStack || 'No component stack'}\n\nUser Agent: ${errorReport.userAgent}\nIP Address: ${errorReport.ip}\n\n---\nThis is an automated message from MangaReader Error Reporting System.`;
    console.log('Error Report Email:', emailContent);
    // Example: Send to webhook for email service
    if (process.env.ERROR_EMAIL_WEBHOOK) {
      await fetch(process.env.ERROR_EMAIL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'support@mangareader.com',
          subject: `Error Report: ${errorReport.errorId || 'New Report'}`,
          text: emailContent,
        }),
      });
    }
  } catch (error) {
    console.error('Failed to send error report email:', error);
  }
}

async function logErrorReport(errorReport: any) {
  try {
    // Log to external monitoring service (e.g., Sentry, LogRocket, etc.)
    if (process.env.MONITORING_WEBHOOK) {
      await fetch(process.env.MONITORING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: `User Error Report: ${errorReport.userMessage}`,
          extra: {
            errorId: errorReport.errorId,
            userEmail: errorReport.userEmail,
            url: errorReport.url,
            statusCode: errorReport.statusCode,
            userAgent: errorReport.userAgent,
          },
          tags: {
            type: 'user_report',
            statusCode: errorReport.statusCode?.toString(),
          },
        }),
      });
    }
  } catch (error) {
    console.error('Failed to log error report to monitoring service:', error);
  }
} 