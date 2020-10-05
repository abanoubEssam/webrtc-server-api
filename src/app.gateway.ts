import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@WebSocketGateway()
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');
  private activeSockets = []


  @SubscribeMessage('msgToServer')
  handleMessage(socket: Socket, payload: string): void {
    this.server.emit('msgToClient', payload);
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Init....');
  }

  handleConnection(socket: Socket, ...args: any[]) {
    const existingSocket = this.activeSockets.find(
      existingSocket => existingSocket === socket.id
    );
    if (!existingSocket) {
      this.activeSockets.push(socket.id);
      socket.emit("update-user-list", {
        users: this.activeSockets.filter(
          existingSocket => existingSocket !== socket.id
        )
      });
      socket.broadcast.emit("update-user-list", {
        users: [socket.id]
      });
    }

    socket.on('join-room', (roomId, userId) => {
      console.log("AppGateway -> handleConnection -> roomId", roomId)
      socket.join(roomId)
      socket.to(roomId).broadcast.emit('user-connected', userId)

      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', userId)
      })
    })

    console.log("AppGateway -> handleDisconnect -> this.activeSockets", this.activeSockets)
    this.logger.log(`Client connected: ${this.activeSockets}`);
  }

  handleDisconnect(socket: Socket) {
    this.activeSockets = this.activeSockets.filter(
      existingSocket => existingSocket !== socket.id
    );
    socket.broadcast.emit("remove-user", {
      clientId: socket.id
    });
    this.logger.log(`Client disconnected: ${socket.id}`);
    console.log("AppGateway -> handleDisconnect -> this.activeSockets", this.activeSockets)
  }
}