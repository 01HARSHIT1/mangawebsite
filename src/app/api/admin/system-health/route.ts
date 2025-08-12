import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const healthChecks = await Promise.allSettled([
            checkDatabaseHealth(),
            checkAPIHealth(),
            checkStorageHealth(),
        ]);

        const services = ['database', 'api', 'storage'];
        const results = healthChecks.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    service: services[index],
                    status: 'error',
                    message: result.reason?.message || 'Unknown error',
                    responseTime: null,
                };
            }
        });

        const systemHealth: any = {
            database: results[0].status,
            api: results[1].status,
            storage: results[2].status,
            lastChecked: new Date().toISOString(),
            details: results,
        };

        // Determine overall system status
        const hasErrors = results.some(r => r.status === 'error');
        const hasWarnings = results.some(r => r.status === 'warning');
        if (hasErrors) {
            systemHealth.overall = 'error';
        } else if (hasWarnings) {
            systemHealth.overall = 'warning';
        } else {
            systemHealth.overall = 'healthy';
        }

        return NextResponse.json(systemHealth);
    } catch (error) {
        console.error('System health check failed:', error);
        return NextResponse.json({
            database: 'error',
            api: 'error',
            storage: 'error',
            overall: 'error',
            lastChecked: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
}

async function checkDatabaseHealth() {
    const startTime = Date.now();
    try {
        const { db } = await connectToDatabase();
        // Test database connection with a simple query
        await db.command({ ping: 1 });
        // Check if collections exist and are accessible
        const collections = await db.listCollections().toArray();
        // Test a simple read operation
        await db.collection('users').findOne({}, { projection: { _id: 1 } });
        const responseTime = Date.now() - startTime;
        // Determine status based on response time
        let status = 'healthy';
        if (responseTime > 500) status = 'warning';
        if (responseTime > 1000) status = 'error';
        return {
            service: 'database',
            status,
            message: `Connected successfully. ${collections.length} collections available.`,
            responseTime,
            details: {
                collections: collections.length,
                responseTime,
            },
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            service: 'database',
            status: 'error',
            message: error instanceof Error ? error.message : 'Database connection failed',
            responseTime,
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

async function checkAPIHealth() {
    const startTime = Date.now();
    try {
        // Test internal API endpoints
        const testEndpoints = [
            '/api/manga?limit=1',
            '/api/users?limit=1',
        ];
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const results = await Promise.allSettled(
            testEndpoints.map(endpoint =>
                fetch(`${baseUrl}${endpoint}`)
            )
        );
        const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
        const totalRequests = results.length;
        const responseTime = Date.now() - startTime;
        let status = 'healthy';
        if (successfulRequests < totalRequests) {
            status = successfulRequests > 0 ? 'warning' : 'error';
        } else if (responseTime > 200) {
            status = 'warning';
        }
        return {
            service: 'api',
            status,
            message: `${successfulRequests}/${totalRequests} API endpoints responding`,
            responseTime,
            details: {
                successfulRequests,
                totalRequests,
                responseTime,
            },
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            service: 'api',
            status: 'error',
            message: error instanceof Error ? error.message : 'API health check failed',
            responseTime,
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

async function checkStorageHealth() {
    const startTime = Date.now();
    try {
        // Check uploads directory
        const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
        // Check if directory exists and is writable
        const stats = await fs.stat(uploadsPath);
        if (!stats.isDirectory()) throw new Error('Uploads path is not a directory');
        // Test write permissions by creating a temporary file
        const testFilePath = path.join(uploadsPath, '.health-check');
        await fs.writeFile(testFilePath, 'health check');
        await fs.unlink(testFilePath);
        // Check available disk space (if possible)
        let diskSpace: number | null = null;
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
                const lines = stdout.trim().split('\n').slice(1);
                const diskInfo = lines.find((line: string) => line.includes('C:'));
                if (diskInfo) {
                    const [, freeSpace] = diskInfo.trim().split(/\s+/);
                    diskSpace = parseInt(freeSpace) / (1024 * 1024 * 1024); // GB
                }
            } else {
                const { stdout } = await execAsync('df -h .');
                const lines = stdout.trim().split('\n');
                const diskInfo = lines[1];
                if (diskInfo) {
                    const parts = diskInfo.trim().split(/\s+/);
                    const usedPercent = parseInt(parts[4].replace('%', ''));
                    diskSpace = 100 - usedPercent;
                }
            }
        } catch (error) {
            // Disk space check failed, but that's not critical
            console.warn('Could not check disk space:', error);
        }
        const responseTime = Date.now() - startTime;
        let status = 'healthy';
        if (diskSpace !== null && diskSpace < 10) {
            status = 'warning'; // Less than 10GB free
        } else if (diskSpace !== null && diskSpace < 1) {
            status = 'error'; // Less than 1GB free
        }
        return {
            service: 'storage',
            status,
            message: 'Storage health check passed',
            responseTime,
            details: {
                diskSpace,
                responseTime,
            },
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            service: 'storage',
            status: 'error',
            message: error instanceof Error ? error.message : 'Storage health check failed',
            responseTime,
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

// Additional health check for specific services
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { service } = body;

        let result;
        switch (service) {
            case 'database':
                result = await checkDatabaseHealth();
                break;
            case 'api':
                result = await checkAPIHealth();
                break;
            case 'storage':
                result = await checkStorageHealth();
                break;
            default:
                return NextResponse.json({
                    error: 'Invalid service specified',
                    status: 400,
                });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Service health check failed:', error);
        return NextResponse.json({
            error: 'Health check failed',
            status: 500,
        });
    }
} 