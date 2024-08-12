import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { validateTelegramWebAppData } from '@/utils/server-checks';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { getTelegramConfig, TelegramConfig } from '@/utils/server-config';

interface CheckTelegramTaskRequestBody {
    initData: string;
    taskId: string;
}

export async function POST(req: Request) {

    const telegramConfig: TelegramConfig | null = getTelegramConfig();

    if (!telegramConfig) {
        return NextResponse.json({ error: 'Telegram configuration is invalid or missing' }, { status: 500 });
    }

    const { apiId, apiHash, botToken } = telegramConfig;

    const requestBody: CheckTelegramTaskRequestBody = await req.json();
    const { initData: telegramInitData, taskId } = requestBody;

    if (!telegramInitData || !taskId) {
        return NextResponse.json({ error: 'Invalid request: missing initData or taskId' }, { status: 400 });
    }

    const { validatedData, user } = validateTelegramWebAppData(telegramInitData);

    if (!validatedData) {
        return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 403 });
    }

    const telegramId = user.id?.toString();

    if (!telegramId) {
        return NextResponse.json({ error: 'Invalid user data: missing telegramId' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (prisma) => {
            // Find the user
            const dbUser = await prisma.user.findUnique({
                where: { telegramId },
            });

            if (!dbUser) {
                throw new Error('User not found in database');
            }

            // Find the task
            const task = await prisma.task.findUnique({
                where: { id: taskId },
            });

            if (!task) {
                throw new Error('Task not found in database');
            }

            // Check if the task is active
            if (!task.isActive) {
                throw new Error('This task is no longer active');
            }

            // Check if the task is of type TELEGRAM
            if (task.type !== 'TELEGRAM' || !task.taskData) {
                throw new Error('Invalid task type or missing task data for this operation');
            }

            const channelUsername = (task.taskData as any).telegramId;
            if (!channelUsername) {
                throw new Error('Missing Telegram channel/group username in task data');
            }

            if (!apiHash) {
                throw new Error('Internal server error with apiHash');
            }

            if (!botToken) {
                throw new Error('Internal server error with botToken');
            }

            // Initialize Telegram client
            const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 });
            await client.start({
                botAuthToken: botToken,
            });

            // Check if the user is a member of the channel/group
            let isMember = false;
            try {
                const channel = await client.invoke(new Api.channels.GetChannels({
                    id: [channelUsername],
                }));
                const participantsResult = await client.invoke(new Api.channels.GetParticipants({
                    channel: channel.chats[0],
                    filter: new Api.ChannelParticipantsRecent(),
                    offset: 0,
                    limit: 1,
                    hash: undefined,
                }));

                if (participantsResult instanceof Api.channels.ChannelParticipants) {
                    isMember = participantsResult.users.some((u: any) => u.id.toString() === telegramId);
                } else {
                    console.log('Unexpected result type from GetParticipants:', participantsResult.constructor.name);
                    isMember = false;
                }
            } catch (error) {
                console.error('Error checking channel membership:', error);
                throw new Error('Failed to check channel membership: ' + (error instanceof Error ? error.message : 'Unknown error'));
            } finally {
                await client.disconnect();
            }

            if (!isMember) {
                return {
                    success: false,
                    message: 'You are not a member of the required Telegram channel/group.',
                };
            }

            // Check if the task is already completed
            const existingUserTask = await prisma.userTask.findUnique({
                where: {
                    userId_taskId: {
                        userId: dbUser.id,
                        taskId: task.id,
                    },
                },
            });

            if (existingUserTask?.isCompleted) {
                return {
                    success: false,
                    message: 'This task has already been completed.',
                    isCompleted: true,
                };
            }

            // Update or create the UserTask as completed
            const updatedUserTask = await prisma.userTask.upsert({
                where: {
                    userId_taskId: {
                        userId: dbUser.id,
                        taskId: task.id,
                    },
                },
                update: {
                    isCompleted: true,
                },
                create: {
                    userId: dbUser.id,
                    taskId: task.id,
                    isCompleted: true,
                },
            });

            // Add points to user's balance
            await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                    points: { increment: task.points },
                    pointsBalance: { increment: task.points },
                },
            });

            return {
                success: true,
                message: 'Task completed successfully',
                isCompleted: updatedUserTask.isCompleted,
            };
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error checking Telegram task:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to check Telegram task' }, { status: 500 });
    }
}