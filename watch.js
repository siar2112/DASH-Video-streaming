
fetch("/videoTitles")
    .then(response => response.json())
    .then(allVideoTitles => {
        var videoList = document.querySelector(".video_list");
        allVideoTitles.forEach(title => {
            var listItem = document.createElement("li");
            var link = document.createElement("a");
            link.textContent = title;
            link.href = "/videoPage?title=" + encodeURIComponent(title);
            listItem.appendChild(link);
            videoList.appendChild(listItem);
        });
    });



var videoHeader = document.querySelector("#Watching_video_title");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const title = urlParams.get('title');

videoHeader.textContent=title;





const videoElement = document.querySelector('#watch_video');
var lastPacketID = 0;
var lastPacketSent = false;

const mimeCodec = 'video/webm; codecs="vp8, opus"';
if ("MediaSource" in window && MediaSource.isTypeSupported(mimeCodec)) {
    console.log("OKKK");
} else {
    console.error("Unsupported MIME type or codec: ", mimeCodec);
}

const themediaSource = new MediaSource();
videoElement.src = URL.createObjectURL(themediaSource);

async function playVideo() {
    const sourceBufferPromise = new Promise((resolve) => {
        themediaSource.addEventListener('sourceopen', () => {
            const sourceBuffer = themediaSource.addSourceBuffer(mimeCodec);
            resolve(sourceBuffer);
        });
    });

    const sourceBuffer = await sourceBufferPromise;

    async function appendChunks(chunks) {
        if (chunks.length === 0 || sourceBuffer.updating) return;

        const currentChunk = chunks.shift();
        const binaryData = new Uint8Array(currentChunk.data);

        try {
            sourceBuffer.appendBuffer(binaryData);
        } catch (e) {
            console.error("Error appending buffer to source buffer:", e);
            return;
        }

        sourceBuffer.addEventListener('updateend', () => {
            appendChunks(chunks);
        }, { once: true });
    }

    videoElement.addEventListener('error', () => {
        console.error('Video error:', videoElement.error);
    });

    videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play(); // Start playing the video
    });

    myInterval = setInterval((event) => {
        fetch("/postVideoInfo", {
            method: 'POST',
            body: JSON.stringify({
                    packetID: lastPacketID,
                    videoTitle: title
                }
            ),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response =>response.json())
            .then(data =>{
                const { idOfLastPacket, isItfinished, streamletArray } = data;
                lastPacketID = idOfLastPacket;
                lastPacketSent = isItfinished;

                appendChunks(streamletArray);

                if (isItfinished) {
                    clearInterval(myInterval);
                    console.log("last packet received");
                }
            }).catch(error => console.error(error));
    }, 12000);
}

playVideo();




/*
async function playVideo() {
    var count=0;
    myInterval = setInterval((event) => {
        fetch("/postVideoInfo", {
            method: 'POST',
            body: JSON.stringify({
                    packetID: lastPacketID,
                    videoTitle: title
                }
            ),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response =>response.json())
            .then(data =>{
                //Change packet
                const { idOfLastPacket, isItfinished, streamletArray } = data;
                console.log("HEERRRRE "+idOfLastPacket);
                lastPacketID=idOfLastPacket;
                lastPacketSent=isItfinished;
                console.log(streamletArray);
                // GET request completed, receives array of next five streamlets (can be lower)
                for(let i=0; i<streamletArray.length;i++){
                    console.log(streamletArray[i]);
                    const binaryData = new Uint8Array(streamletArray[i].data)
                    const blob = new Blob(binaryData,{type:mimeCodec});
                    console.log(blob);
                    receivedBlobs.push(streamletArray[i].data);
                    const a = document.createElement('a');
                    var url = URL.createObjectURL(blob);
                    // Passing the blob downloading url
                    a.setAttribute('href', url);

                    // Setting the anchor tag attribute for downloading
                    // and passing the download file name
                    a.setAttribute('download','jojo');

                    a.click();

                    try {
                        sourceBuffer.appendBuffer(binaryData);
                    } catch (e) {
                        console.error("Error appending buffer to source buffer:", e);
                    }
                }
                console.log(receivedBlobs);

                if (isItfinished) {
                    clearInterval(myInterval);
                    console.log("last packet received");
                    console.log(receivedBlobs);
                    const blob = new Blob(receivedBlobs, { type: mimeCodec });
                    console.log(blob);
                    const a = document.createElement('a');
                    var url = URL.createObjectURL(blob);
                    // Passing the blob downloading url
                    a.setAttribute('href', url);

                    // Setting the anchor tag attribute for downloading
                    // and passing the download file name
                    a.setAttribute('download','Blobs');

                    a.click();
                    clearInterval(myInterval);
                }
            }).catch(error => console.error(error));
        /*count++
        console.log(count);
    }, 3000);
}*/