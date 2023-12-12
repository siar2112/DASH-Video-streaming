
const http = require('http');
const express = require("express");
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require('fs');






const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '50mb'}));

const hostname = '127.0.0.1';
const port = 3000;



const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
});

/*server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});*/


//Change it to your own SQL database info
var con = mysql.createConnection({
    host:"localhost",
    port:"3306",
    user:"root",
    password:"",
    database:"Comp445_lab2"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});



app.listen(3000, () => {
    console.log("Application started and Listening on port 3000");
});


app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/videoTitles", (req, res) => {

    const allVideoTitles=[];
    const getAlltitles = "SELECT distinct VideoTitle From Videos";
    con.query(getAlltitles, (err, results, fields) => {
        if (err) {
            console.log("error");
            //res.status(500).json({ message: 'Failed to insert video data' });
        } else {
            for(let i=0;i<results.length;i++){
                allVideoTitles.push(results[i].VideoTitle);
            }
            res.json(allVideoTitles);
        }
    });
});



app.get("/videoPage", (req, res) => {
    var title=req.query.title


    res.sendFile(__dirname + '/watchVideo.html', {
        headers: {
            'Content-Type': 'text/html',
            'Video-Title': title,
        },
    });
    console.log("Here is"+title);
});




// Set up storage for uploaded videos
const storage = multer.diskStorage({
    destination:'streamlets',
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    },
})

const upload = multer({ storage: storage });


// Handle video upload
app.post('/upload',upload.single('video'), (req, res, next) => {

    const packetID= req.body.packetID;
    const title = req.body.title;
    const filepath = req.file.path;
    //req.file.mimetype='video/webm;codecs=vp8,opus';
    console.log(req.file);
    // Do something with the title and filepath
    console.log(packetID,title, filepath);
    res.status(200).json({ message: 'Video uploaded  to server successfully' });

    /*if (!allVideoTitles.includes(title)) {
        allVideoTitles.push(title);
    }*/

    const insertVideoPackage = `INSERT INTO Videos (PacketID,VideoTitle,VideoFile) VALUES (?,?,?)`;
    con.query(insertVideoPackage, [packetID, title, filepath], (error, results, fields) => {
        if (error) {
            console.error(error);
            //res.status(500).json({ message: 'Failed to insert video data' });
        } else {
            console.log('Video data inserted successfully');
            //res.status(200).json({ message: 'Video uploaded successfully' });
        }
    });
});

function pushData(path){
    const promises = [];
    for (let i = 0; i < path.length; i++) {
        const promise = new Promise((resolve, reject) => {
            fs.readFile(path[i], (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        promises.push(promise);
    }
    return Promise.all(promises);
}


app.post('/postVideoInfo', (req, res, next) => {
    const lastpacketID = req.body.packetID;
    const title = req.body.videoTitle;
    var highestPacket;
    const getHighestPacketID="SELECT PacketID FROM Videos WHERE VideoTitle = ? ORDER BY PacketID DESC Limit 1;"
    con.query(getHighestPacketID, [title], (err, results, fields) => {
        if (err) throw err;
        console.log(results);
        highestPacket = results[0].PacketID;
    });

    console.log(lastpacketID, title);
    const getAppropriateStreamletsUrlQuery = 'SELECT * FROM videos WHERE PacketID > ? AND PacketID <= ? AND VideoTitle = ?';
    con.query(getAppropriateStreamletsUrlQuery, [lastpacketID, lastpacketID + 3,title], async (err, results, fields) => {
        if (err) throw err;
        var streamletPaths = [];
        var streamletArray=[];


        for(let i=0;i<results.length;i++){
            streamletPaths.push(results[i].videoFile);
        }




        console.log(results);

        var idOfLastPacket;
        var isItfinished;
        // You can perform any additional operations with the results here
        idOfLastPacket = results[results.length - 1].PacketID;
        if (idOfLastPacket == highestPacket) {
            isItfinished = true;
        } else {
            isItfinished = false;
        }


        console.log("YOOOOO" + idOfLastPacket);

        pushData(streamletPaths).then(data => {
            streamletArray = data;
            console.log(streamletArray);
            res.json({idOfLastPacket, isItfinished, streamletArray});
        }).catch(err => {
            console.error(err);
        });
    });
});






