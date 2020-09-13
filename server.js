// importing
const mongoose = require("mongoose");
const express = require("express");
const Pusher = require("pusher");
const Messages = require('./dbMessages.js');


// app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
  appId: '1072113',
  key: '5edfc75639f0fa5977fb',
  secret: 'ee2645114a6a2d8b1a50',
  cluster: 'ap1',
  encrypted: true
});


// middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
})

// DB config
const connection_url = 'mongodb+srv://admin:Q7xp8tZbmYj2JAGk@cluster0.aa9qf.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('DB connected');

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    console.log(change);

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;

      pusher.trigger('message', 'inserted',
        {
          name: messageDetails.name,
          message: messageDetails.message,
        }
      )
    } else {
      console.log("Error triggering Pusher");
    }
  })

})

// ????


// api routes
app.get('/', (req, res) => res.status(200).send('Hello world'));

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(data);
      }
  })
});

// listen
app.listen(port, ()=>console.log(`Listening on localhost: ${port}`));