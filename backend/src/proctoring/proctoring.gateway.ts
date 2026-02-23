import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SessionsService } from '../sessions/sessions.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ProctoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, string> = new Map(); // socketId -> userId
    private activeExamRooms: Map<string, Set<string>> = new Map(); // examId -> Set of socketIds

    constructor(
        private jwtService: JwtService,
        private sessionsService: SessionsService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token?.split(' ')[1];
            if (!token) return client.disconnect();

            const payload = this.jwtService.verify(token);
            this.connectedUsers.set(client.id, payload.sub);

            console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
        } catch (e) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = this.connectedUsers.get(client.id);
        this.connectedUsers.delete(client.id);
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_exam')
    handleJoinExam(@ConnectedSocket() client: Socket, @MessageBody() data: { examId: string; sessionId: string }) {
        client.join(`exam_${data.examId}`);
        client.join(`session_${data.sessionId}`);

        // Notify proctors that a student joined
        this.server.to(`proctor_${data.examId}`).to('proctors_global').emit('student_joined', {
            sessionId: data.sessionId,
            userId: this.connectedUsers.get(client.id),
            timestamp: new Date(),
        });

        return { status: 'joined' };
    }

    @SubscribeMessage('proctor_join')
    handleProctorJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { examId: string }) {
        if (data.examId === 'global') {
            client.join('proctors_global');
            return { status: 'joined_global_monitoring' };
        }
        client.join(`exam_${data.examId}`);
        client.join(`proctor_${data.examId}`);
        return { status: 'proctor_joined' };
    }

    @SubscribeMessage('cheat_event')
    async handleCheatEvent(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; examId: string; type: string; weight: number; metadata?: any },
    ) {
        const userId = this.connectedUsers.get(client.id);
        if (!userId) return;

        // Persist event to DB and update suspicion score
        const result = await this.sessionsService.addSuspicionScore(
            data.sessionId,
            data.weight,
            data.type,
            data.metadata,
        );

        // Broadcast to proctors in real-time
        this.server.to(`proctor_${data.examId}`).to('proctors_global').emit('suspicion_alert', {
            sessionId: data.sessionId,
            userId,
            type: data.type,
            severity: result.severity,
            totalScore: result.suspicionScore,
            timestamp: new Date(),
            metadata: data.metadata,
        });

        return result;
    }

    @SubscribeMessage('submit_snapshot')
    handleSnapshot(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; examId: string; image: string },
    ) {
        // In a real app, we'd upload to S3 here. 
        // For the MVP, we stream the snapshot to the proctor dashboard for live monitoring.
        this.server.to(`proctor_${data.examId}`).to('proctors_global').emit('live_snapshot', {
            sessionId: data.sessionId,
            image: data.image,
            timestamp: new Date(),
        });
    }
}
