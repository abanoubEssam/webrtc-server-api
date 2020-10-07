import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
const { AwakeHeroku } = require('awake-heroku');

async function bootstrap() {
  const logger: Logger = new Logger('bootstrap');

  const port = process.env.PORT || 3000
  const app = await NestFactory.create(AppModule);
  

  if (process.env.NODE_ENV !== "development") {
    AwakeHeroku.add({
      url: "https://webrtc-server-api.herokuapp.com/"
    })
    
  }
  await app.listen(port);
  logger.log(`App Starts with Port ${port}`)
}
bootstrap();
