import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server, } from 'socket.io';
import * as UsernameGenerator from 'username-generator'
@WebSocketGateway({ namespace: '/' })
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');
  private activeSockets = []


  @SubscribeMessage('msgToServer')
  handleMessage(socket: Socket, payload: string): WsResponse<string> {
    // this.server.emit('msgToClient', payload);
    return { event: "msgToClient", data: payload }
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Init....');
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    this.activeSockets = this.activeSockets.filter(existingSocket => {
      return existingSocket.socketId !== socket.id
    });
    console.log("AppGateway -> handleDisconnect -> existingSockets", this.activeSockets)
  }

  handleConnection(socket: Socket, ...args: any[]) {
    const currentUserName = UsernameGenerator.generateUsername("-")
    const userPayload = {
      socketId: socket.id,
      name: currentUserName
    }
    console.log("AppGateway -> handleConnection -> userPayload", userPayload)


    console.log("ME NOW: ", socket.id)

    const existingSocket = this.activeSockets.find(
      existingSocket => existingSocket.socketId === socket.id
    );

    if (!existingSocket) {

      this.activeSockets.push(userPayload);

      console.log("AppGateway -> handleConnection -> this.activeSockets", this.activeSockets)
      socket.emit("users-list", {
        users: this.activeSockets.filter(
          existingSocket => existingSocket.socketId !== socket.id
        )
      });
      socket.broadcast.emit("users-list",
        [userPayload]
      );
    }

    socket.emit("conn-success", { socketId: socket.id, name: currentUserName })
    // when offer gets fired

    socket.on('offer', payload => {
      const userConnection = this.activeSockets.filter(reseiver => {
        return reseiver.name == payload.name
      })
      socket.to(userConnection[0].socketId).emit('offer', payload);
    });

    socket.on('answer', payload => {
      const userConnection = this.activeSockets.filter(reseiver => {
        return reseiver.name == payload.name
      })
      socket.to(userConnection[0].socketId).emit('answer', payload);
    });

    socket.on('ice-candidate', incoming => {
      const userConnection = this.activeSockets.filter(reseiver => {
        return reseiver.name == incoming.name
      })
      socket.to(userConnection[0].socketId).emit('ice-candidate', incoming.candidate);
    });

    // socket.on('join-room', (roomId, userId) => {
    //   console.log("AppGateway -> handleConnection -> roomId", roomId)
    //   socket.join(roomId)
    //   socket.to(roomId).broadcast.emit('user-connected', userId)

    //   socket.on('disconnect', () => {
    //     socket.to(roomId).broadcast.emit('user-disconnected', userId)
    //   })
    // })

    // this.logger.log(`Clients connected: ${this.activeSockets}`);
  }


}