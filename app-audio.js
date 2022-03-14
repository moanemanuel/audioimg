const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'Conectando...');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', 'BOT-ZDG Dispositivo pronto!');
    socket.emit('message', 'BOT-ZDG Dispositivo pronto!');	
    console.log('BOT-ZDG Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', 'BOT-ZDG Autenticado!');
    socket.emit('message', 'BOT-ZDG Autenticado!');
    console.log('BOT-ZDG Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', 'BOT-ZDG Falha na autenticação, reiniciando...');
    console.error('BOT-ZDG Falha na autenticação');
});

client.on('change_state', state => {
  console.log('BOT-ZDG Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', 'BOT-ZDG Cliente desconectado!');
  console.log('BOT-ZDG Cliente desconectado', reason);
  client.initialize();
});
});

// Send media
app.post('/send-media', async (req, res) => {
    const number = req.body.number + '@c.us';
    const filePath = req.body.path;
  
    const media = MessageMedia.fromFilePath(filePath);
  
    client.sendMessage(number, media, {sendAudioAsVoice: true}).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  });
  

  server.listen(port, function() {
    console.log('App running on *: ' + port);
  });
  