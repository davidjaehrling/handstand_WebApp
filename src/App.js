import React,{useRef, useEffect,useState} from 'react';
import './App.css';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
// Register one of the TF.js backends.
import '@tensorflow/tfjs-backend-webgl';
import { classify, drawKeypoints, drawSkeleton } from "./utilities";
//import mp3 from "./mp3"


function App() {
  let lastTrueTime = Date.now();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const soundContext = require.context('./mp3', true, /\.mp3$/);
  const sounds = soundContext.keys().reduce((sounds, soundFile) => {
    sounds[soundFile] = soundContext(soundFile);
    return sounds;
  }, {});

  const soundFiles = [
    './straight.mp3',
    './legs_apart.mp3',
    './legs_bend.mp3',
    './elbows_bend.mp3',
    './sholders_bend.mp3',
    './hips_bend.mp3',
    './hollowback.mp3'
  ];

  // Load MoveNet
  function play_sound(label){
    console.log(soundFiles[label.findIndex(x => x === 1)]);
    new Audio(sounds[soundFiles[label.findIndex(x => x === 1)]]).play()
  }


  const runMoveNet = async () => {
    const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
    const net = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    //
    setInterval(() => {
      detect(net);
    }, 100);
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

      // Set video width
      videoRef.current.width = videoWidth;
      videoRef.current.height = videoHeight;

      // Make Detections
      const pose = await net.estimatePoses(video);

      if (Date.now() - lastTrueTime > 3000) {
      
      
      //Check if whole body is visible
      let k = pose[0]["keypoints"]
      const label = classify(pose[0]["keypoints"]);
      if (pose[0]["keypoints"].every(keypoint => keypoint.score > 0.1)){
        if (k[16].y<k[6].y || k[15].y<k[5].y){
          //const label = classify(pose[0]["keypoints"]);
          console.log(label)

          if (Date.now() - lastTrueTime > 2000) {
            // Your code to be executed every 3 seconds
            //console.log("condition is true");
            
            play_sound(label);
          }
        }
      }
      lastTrueTime = Date.now();
      }
      

      
      

      drawCanvas(pose[0], video, videoWidth, videoHeight, canvasRef);
    }
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;


    drawKeypoints(pose["keypoints"], 0.3, ctx);
    drawSkeleton(pose["keypoints"], 0.3, ctx);
  };


  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ 
        video: {facingMode: "user", width: 480, height: 640 }
      }).then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
        console.log(video)
      })
      .catch(err => {
        console.error(err);
      })
  }

  useEffect(() => {
    getVideo();
    runMoveNet();

  }, [videoRef])

  


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
