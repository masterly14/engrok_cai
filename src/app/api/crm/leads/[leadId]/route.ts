import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../../../../lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { leadId: string } }) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = params;

    try {
        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                userId: user.id,
            },
            include: {
                stage: true,
            }
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error(`Error fetching lead ${leadId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { leadId: string } }) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = params;

    try {
        const body = await request.json();
        const { stageId, ...dataToUpdate } = body;

        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                userId: user.id,
            }
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        if (stageId) {
            const stage = await prisma.stage.findUnique({
                where: {
                    id_userId: {
                        id: stageId,
                        userId: user.id,
                    },
                },
            });
            if (!stage) {
                return NextResponse.json({ error: 'Stage not found for this user.' }, { status: 404 });
            }
            dataToUpdate.stageId = stageId;
        }

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: dataToUpdate,
        });

        return NextResponse.json(updatedLead);
    } catch (error) {
        console.error(`Error updating lead ${leadId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { leadId: string } }) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = params;

    try {
         const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                userId: user.id,
            }
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        await prisma.lead.delete({
            where: {
                id: leadId,
            },
        });

        return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Error deleting lead ${leadId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 