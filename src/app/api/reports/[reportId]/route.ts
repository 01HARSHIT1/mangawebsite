import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from @/lib/mongodb;
import { verifyToken } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: [object Object]params: [object Object]reportId: string } }
) {
    try[object Object]
    const token = request.headers.get(authorization')?.replace(Bearer, );
    if (!token) {
        return NextResponse.json({ error: Unauthorized }, {
            status: 401;
        }

    const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({
                error: 'Admin access required },{ status: 403;
            }

    const body = await request.json();
            const { action, contentAction } = body;

            if (!action || ![approve', reject', 'dismiss].includes(action)) {
      return NextResponse.json({ error: Invalid action }, {
                status: 400;
            }

    const { db } = await connectToDatabase();

            // Get the report
            const report = await db.collection(reports').findOne({ _id: params.reportId });
    if (!report) {
                return NextResponse.json({ error: Report not found }, { status: 404 }

    // Update report status
    const updateData: any = {
                    status: action === 'approve' ? 'resolved :action === reject ? 'reviewed' : dismissed,
      updatedAt: new Date(),
                    moderatorId: user._id,
                    moderatorEmail: user.email,
                    action: action,
                    contentAction: contentAction || null
                };

                await db.collection('reports').updateOne(
                    [object Object]_id: params.reportId },
            { $set: updateData }
    );

            // Handle content actions
            if (action === 'approve && contentAction ===remove') [object Object]     // Remove the reported content
            if (report.contentType === manga) [object Object]      await db.collection(manga').updateOne(
          { _id: report.contentId },
                [object Object] $set: [object Object]status: removed', removedAt: new Date(), removedBy: user._id } }
            );
        } else if (report.contentType === 'chapter)[object Object]      await db.collection(chapters').updateOne(
            { _id: report.contentId },
            [object Object] $set: [object Object]status: removed', removedAt: new Date(), removedBy: user._id } }
        );
    } else if (report.contentType === 'comment)[object Object]      await db.collection(comments').updateOne(
        { _id: report.contentId },
        [object Object] $set: [object Object]status: removed', removedAt: new Date(), removedBy: user._id } }
    );
} else if (report.contentType === user) [object Object]      await db.collection(users').updateOne(
          { _id: report.contentId },
    [object Object] $set: { status: 'suspended', suspendedAt: new Date(), suspendedBy: user._id } }
);
      }
    } else if (action === reject) {   // Flag content for review
    if (report.contentType === manga) [object Object]      await db.collection(manga').updateOne(
          { _id: report.contentId },
        { $set: { flagged: true, flaggedAt: new Date(), flaggedBy: user._id } }
    );
} else if (report.contentType === 'chapter)[object Object]      await db.collection(chapters').updateOne(
    { _id: report.contentId },
    { $set: { flagged: true, flaggedAt: new Date(), flaggedBy: user._id } }
);
      } else if (report.contentType === 'comment)[object Object]      await db.collection(comments').updateOne(
    { _id: report.contentId },
    { $set: { flagged: true, flaggedAt: new Date(), flaggedBy: user._id } }
);
      }
    }

// Send notification to reporter
const notification = {
    userId: report.reporterId,
    type: report_update',
      title: Report Update',
      message: `Your report has been ${action === 'approve' ? 'approved :action === reject ? 'reviewed' : 'dismissed'}.`,
data: [object Object]
reportId: params.reportId,
    action: action,
        contentType: report.contentType,
            contentId: report.contentId
      },
createdAt: new Date(),
    read: false
    };

await db.collection('notifications').insertOne(notification);

return NextResponse.json({
    success: true,
    message: `Report ${action}ed successfully`
});

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({
        error: 'Internal server error },[object Object] status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: [object Object]params: [object Object]reportId: string } }
) {
    try[object Object]
    const token = request.headers.get(authorization')?.replace(Bearer, );
    if (!token) {
        return NextResponse.json({ error: Unauthorized }, {
            status: 401;
        }

    const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({
                error: 'Admin access required },{ status: 403;
            }

    const { db } = await connectToDatabase();

            const report = await db.collection(reports').findOne({ _id: params.reportId });
    if (!report) {
                return NextResponse.json({ error: Report not found }, {
                    status: 404
                }

    // Get additional context based on content type
    let content = null;
                if (report.contentType === 'manga)[object Object]   content = await db.collection(manga').findOne({ _id: report.contentId });
            } else if (report.contentType === chapter) [object Object]   content = await db.collection('chapters').findOne({ _id: report.contentId });
        } else if (report.contentType === comment) [object Object]   content = await db.collection('comments').findOne({ _id: report.contentId });
    } else if (report.contentType === 'user)[object Object]   content = await db.collection(users').findOne({ _id: report.contentId });
}

// Get reporter info
const reporter = await db.collection(users').findOne({ _id: report.reporterId });

    return NextResponse.json([object Object] report: {
    ...report,
    content,
    reporter
}
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({
        error: 'Internal server error },[object Object] status: 500 });
    }
} 