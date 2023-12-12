
var record_button=document.getElementById('btn_record');
var stop_button=document.getElementById('btn_stop_record');
var upload_container=document.getElementById('upload_container');
var video = document.querySelector('#upload_video');

var myInterval;

var uploadTitle="";


var packetID =0;





 var recorder;
 var recordedBlobs = [];



 //Get all videoTitle
 // One html file, Create link








 // Before uploading, every video must have a title
 //Must verify that title is not taken else, prompt user to change
 function titleVideo(){
     uploadTitle = prompt("Please enter your video title (must be unique):");
 }


const mimeCodec = 'video/webm;codecs=vp8';
if ("MediaSource" in window && MediaSource.isTypeSupported(mimeCodec)) {

    console.log("OKKK")
}else{
    console.error("Unsupported MIME type or codec: ", mimeCodec);
}


 async function uploadVideo() {
     navigator.mediaDevices.getUserMedia({video: true, audio: true})
         .then((stream) => {

             //allow the user to see what his camera is capturing
             video.srcObject = stream;
             video.onloadedmetadata = function (e) {
                 video.play();
             };
             //record stream data
             recorder = new MediaRecorder(stream,{mimeType:mimeCodec});
             recorder.addEventListener('dataavailable', (event) => {
                 recordedBlobs.push((event.data));
                 packetID++;
                 sendVideoPacketToServer(packetID,uploadTitle,event.data);
             })

             record_button.addEventListener('click', (event) => {
                 titleVideo();
                 console.log("recoding start")
                 packetID=0;
                 record_button.style.display = "none"
                 stop_button.style.display = "block"
                 video.play();
                 video.style.opacity=1;
                 recorder.start(3000);
             })

             stop_button.addEventListener('click', (event) => {
                 console.log("recording stop");
                 stop_button.style.display = "none";
                 record_button.style.display = "block";
                 upload_container.style.backgroundColor="black";
                 video.style.opacity=0;
                 recorder.stop();
                 video.pause();
                 video.style.backgroundColor = "black"
             })


             recorder.addEventListener('stop', (event) => {
                 clearInterval(myInterval);

                 console.log(recordedBlobs);
                 var blob = new Blob(recordedBlobs, {type:mimeCodec});

                 console.log(blob);


                 var url = URL.createObjectURL(blob);

                 // Creating an anchor(a) tag of HTML
                 const a = document.createElement('a');

                 // Passing the blob downloading url
                 a.setAttribute('href', url);

                 // Setting the anchor tag attribute for downloading
                 // and passing the download file name
                 a.setAttribute('download', uploadTitle);

                 a.click();
                 recordedBlobs = [];
             })

             /*recorder.addEventListener('start',event=>{
                 if(uploadTitle!==""){
                    myInterval=setInterval((event)=>{
                            //packetID++;
                            var blob = new Blob(recordedBlobs, {type: 'video/webm'});
                            var url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.setAttribute('href', url);
                            a.setAttribute('download', uploadTitle);
                            a.click();
                            //sendVideoPacketToServer(packetID,uploadTitle,blob);

                     }, 3000);
                 }
                 else {
                     console.log("Video must have a unique title");
                 }
             })*/

         })
         .catch(function (err) {
             console.log("An error occurred: " + err);
         });
 }



 uploadVideo();




 function sendVideoPacketToServer(packetID,videoTitle,blobFile){
    console.log(packetID);
    console.log(blobFile);
     //const blob = new Blob([blobFile], { type:mimeCodec });
     var url = URL.createObjectURL(blobFile);

     // Creating an anchor(a) tag of HTML
     const a = document.createElement('a');

     // Passing the blob downloading url
     a.setAttribute('href', url);

     // Setting the anchor tag attribute for downloading
     // and passing the download file name
     a.setAttribute('download', 'daaam');

     a.click();


     const formData = new FormData();
     formData.append('packetID', packetID);
     formData.append('title', videoTitle);
     formData.append('video', blobFile, uploadTitle+'-'+packetID+'.webm');
     fetch('/upload', {
         method: 'POST',
         /*headers: {
             'Content-Type': 'multipart/form-data'
         },*/
         /*body: JSON.stringify({
             packetID: packetID,
             title: videoTitle,
             }),*/
         body:formData
     }).then(response => response.json())
         .then(data => {
             console.log('Upload successful:', data);
         })
         .catch((error) => {
             console.error('Error:', error);
         });
}



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