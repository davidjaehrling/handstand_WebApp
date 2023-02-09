import React,{useRef, useEffect} from 'react';
import './App.css';
import * as poseDetection from '@tensorflow-models/pose-detection';
//import * as tf from '@tensorflow/tfjs-core';
// Register one of the TF.js backends.
import '@tensorflow/tfjs-backend-webgl';
import { classify, drawKeypoints, drawSkeleton, mirrorKeypoints} from "./utilities";
//import * as tf from '@tensorflow/tfjs';


function App() {
  let lastTrueTime = Date.now();
  var k_last = 0;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const soundContext = require.context('./mp3', true, /\.mp3$/);
  const sounds = soundContext.keys().reduce((sounds, soundFile) => {
    sounds[soundFile] = soundContext(soundFile);
    return sounds;
  }, {});
  const soundEffect = new Audio();
  soundEffect.autoplay = true;
  soundEffect.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
  
  
  const soundFiles = [
    './straight.mp3',
    './legs_apart.mp3',
    './legs_bend.mp3',
    './elbows_bend.mp3',
    './sholders_bend.mp3',
    './hips_bend.mp3',
    './hollowback.mp3'
  ];


function getDistance(keypointsOld, keypointsNew) {
    let maxDistance = 0;
    
    for (let i = 0; i < keypointsOld.length; i++) {
        let xOld = keypointsOld[i].x;
        let yOld = keypointsOld[i].y;
        let xNew = keypointsNew[i].x;
        let yNew = keypointsNew[i].y;
        
        let distance = Math.sqrt(Math.pow(xOld - xNew, 2) + Math.pow(yOld - yNew, 2));
        //console.log(distance);
        //console.log(keypointsNew[i].score);
        if (distance > maxDistance & keypointsNew[i].score > 0.3) {
            maxDistance = distance;
        }
    }

    return maxDistance;
}

  function play_sound(label){
    // later on when you actually want to play a sound at any point without user interaction
    soundEffect.src = sounds[soundFiles[label.findIndex(x => x === 1)]];
    soundEffect.play();
    console.log(sounds[soundFiles[label.findIndex(x => x === 1)]]);
  }


  const runMoveNet = async () => {
    const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
    const net = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

  
    //const classify_model = await tf.loadModel({
      modelUrl: ".tfjs_model/model.json",
      weightsUrl: ".tfjs_model/weights.bin"
    });
    
    console.log(classify_model);
    //
    setInterval(() => {
      detect(net);
    }, 10);
  };


  


  const detect = async (net) => {
    if (
      typeof videoRef.current !== "undefined" &&
      videoRef.current !== null
    ) {
      // Get Video Properties
      const video = videoRef.current;
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      //console.log(video);

      // Set video width
      videoRef.current.width = videoWidth;
      videoRef.current.height = videoHeight;


      /* FÜR Tonaugabetest
      if (Date.now() - lastTrueTime > 2000) {
        // code to be executed every 3 seconds
        lastTrueTime = Date.now();
        play_sound([0,1,0,0,0,0]);
      }
      */

      // Make Detections
      const pose = await net.estimatePoses(video,{maxPoses: 1, flipHorizontal: true});

      
      // mirror pose
      pose[0]["keypoints"] = mirrorKeypoints(pose[0]["keypoints"],videoWidth);
      let k = pose[0]["keypoints"]

      
      if (k_last == 0) {
        k_last = pose[0]["keypoints"]
      }
      let distance = getDistance(k_last,k);
      k_last = pose[0]["keypoints"]


      if (distance < 50){
        //Validatie Keypoints
        if (pose[0]["keypoints"].every(keypoint => keypoint.score > 0.1)){
          //whole body visible
          if (k[16].y<k[6].y || k[15].y<k[5].y){
            //handstand detection starts when feet are above sholders
            const label = classify(pose[0]["keypoints"]);
            console.log(label)

            if (Date.now() - lastTrueTime > 2000) {
              // code to be executed every 3 seconds
              lastTrueTime = Date.now();
              play_sound(label);
            }
          }
        }
      }
      
      
    
      drawCanvas(pose[0], video, videoWidth, videoHeight, canvasRef);
    }
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    //const ctx = canvas.current.getContext("2d");
    const ctx = canvas.current.getContext("2d");


    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;


    drawKeypoints(pose["keypoints"], 0.25, ctx);
    drawSkeleton(pose["keypoints"], 0.25, ctx);
  };


  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ 
        audio: false,
        video: { facingMode: "user", width: 480, height: 640 ,frameRate: {ideal:30}}
      }).then(stream => {
        let video = videoRef.current;
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.srcObject = stream;

        video.play();
        //console.log(video)
      })
      .catch(err => {
        console.error(err);
      })
  }

  useEffect(() => {
    getVideo();
    

  }, [videoRef])

  runMoveNet();
  


  return (
    <div className="App">
      <div className="camera">
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 480,
            height: 640,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 480,
            height: 640,
          }}
        />

      </div>
    </div>
  );
}

export default App;
