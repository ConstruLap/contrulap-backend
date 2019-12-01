const AssistantV1 = require('watson-developer-cloud/assistant/v1');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const {
    IamAuthenticator
} = require('ibm-watson/auth');
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


const multipart = require('connect-multiparty');
const multipartMiddleware = multipart({
    uploadDir: './assets'

});


var cors = require('cors');
app.use(cors("*"))

let Promise = require('bluebird');

let paramsCloudant = {
    "username": "96ba32ad-e17d-494f-a93e-72240b1e0b16-bluemix",
    "host": "96ba32ad-e17d-494f-a93e-72240b1e0b16-bluemix.cloudant.com",
    "dbname": "btplus",
    "password": "e373c010bcb53c3ea89a59f7fa2642789e7bfe3128bab1c3e2762b713ab04641"
};

app.get('/', function (req, res) {
    res.send("response");
});

var port = process.env.PORT || 3001
app.listen(port, function () {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});

var fs = require('fs');
var https = require('https');

var options = {
    key: fs.readFileSync('./certs/server-key.pem'),
    cert: fs.readFileSync('./certs/server-crt.pem'),
    ca: fs.readFileSync('./certs/ca-crt.pem'),
};

https.createServer(options, app, function (req, res) {}).listen(3000);

const assistant = new AssistantV1({
    username: 'apikey',
    password: 'wXgR4HPVBQ3ta2JoOYeNRRR4rxv0vSryJ4QhpxeazeYK',
    url: 'https://gateway.watsonplatform.net/assistant/api/',
    version: '2018-02-16',
});

app.post('/api/dashboard/upload', multipartMiddleware, (req, res) => {
    console.log("upload")
    fs.rename('./' + req.files.uploads[0].path, './assets/' + 'audio.wav', function (err) {
        if (err) throw err;
        fs.stat('./assets/' + 'audio.wav', function (err, stats) {
            if (err) throw err;
            console.log('stats: ' + JSON.stringify(stats));
        });





        const speechToText = new SpeechToTextV1({
            authenticator: new IamAuthenticator({
                apikey: 'wJ2Anrjt-92-XGBokgEpqQ802jEk1ucvw7F6whcKY0_q',
            }),
            url: 'https://stream.watsonplatform.net/speech-to-text/api',
        });

        var params = {
            objectMode: true,
            contentType: 'audio/wav',
            model: 'pt-BR_BroadbandModel',
            keywords: ['cimento'],
            keywordsThreshold: 0.5,
            maxAlternatives: 3
        };

        // Create the stream.
        var recognizeStream = speechToText.recognizeUsingWebSocket(params);

        // Pipe in the audio.
        fs.createReadStream('./assets/' + 'audio.wav').pipe(recognizeStream);

        /*
         * Uncomment the following two lines of code ONLY if `objectMode` is `false`.
         *
         * WHEN USED TOGETHER, the two lines pipe the final transcript to the named
         * file and produce it on the console.
         *
         * WHEN USED ALONE, the following line pipes just the final transcript to
         * the named file but produces numeric values rather than strings on the
         * console.
         */
        // recognizeStream.pipe(fs.createWriteStream('transcription.txt'));

        /*
         * WHEN USED ALONE, the following line produces just the final transcript
         * on the console.
         */
        // recognizeStream.setEncoding('utf8');

        // Listen for events.
        recognizeStream.on('data', function (event) {
            onEvent('Data:', event);
        });
        recognizeStream.on('error', function (event) {
            onEvent('Error:', event);
        });
        recognizeStream.on('close', function (event) {
            onEvent('Close:', event);
        });

        // Display events on the console.
        function onEvent(name, event) {
            if (event != undefined) {
                if (event.results != undefined) {
                    if (event.results[0] != undefined) {
                        if (event.results[0].alternatives[0] != undefined) {
                            if (event.results[0].alternatives[0].transcript != undefined) {

                                const text = event.results[0].alternatives[0].transcript;
                                const context = {};

                                const params = {
                                    input: {
                                        text
                                    },
                                    workspace_id: 'a6ac6811-d963-4989-bd47-e6d651aa6575',
                                    context,
                                };
                            
                                assistant.message(params, (err, response) => {
                                    if (err) {
                                        console.error(err);
                                        res.status(500).json(err);
                                    } else {
                            
                                        let resp = {
                                            text: response.output.text[0],
                                            context: response.context,
                                            output: response.output.text[0]
                                        }
                            
                                        res.json(resp.text);
                            
                                    }
                                });
                            }
                        }
                    }
                }
            }


            // console.log(name, JSON.stringify(event, null, 2));
        };

    })
})



app.post('/conversation/', (req, res) => {
    const {
        text,
        context = {}
    } = req.body;

    const params = {
        input: {
            text
        },
        workspace_id: 'a6ac6811-d963-4989-bd47-e6d651aa6575',
        context,
    };

    assistant.message(params, (err, response) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
        } else {

            let resp = {
                text: response.output.text[0],
                context: response.context,
                output: response.output.text[0]
            }

            res.json(resp);

        }
    });
});