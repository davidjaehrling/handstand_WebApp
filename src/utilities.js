/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';

const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;

export const tryResNetButtonName = "tryResNetButton";
export const tryResNetButtonText = "[New] Try ResNet50";
const tryResNetButtonTextCss = "width:100%;text-decoration:underline;";
const tryResNetButtonBackgroundCss = "background:#e61d5f;";

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMobile() {
  return isAndroid() || isiOS();
}

function setDatGuiPropertyCss(propertyText, liCssString, spanCssString = "") {
  var spans = document.getElementsByClassName("property-name");
  for (var i = 0; i < spans.length; i++) {
    var text = spans[i].textContent || spans[i].innerText;
    if (text == propertyText) {
      spans[i].parentNode.parentNode.style = liCssString;
      if (spanCssString !== "") {
        spans[i].style = spanCssString;
      }
    }
  }
}

export function updateTryResNetButtonDatGuiCss() {
  setDatGuiPropertyCss(
    tryResNetButtonText,
    tryResNetButtonBackgroundCss,
    tryResNetButtonTextCss
  );
}

/**
 * Toggles between the loading UI and the main canvas UI.
 */
export function toggleLoadingUI(
  showLoadingUI,
  loadingDivId = "loading",
  mainDivId = "main"
) {
  if (showLoadingUI) {
    document.getElementById(loadingDivId).style.display = "block";
    document.getElementById(mainDivId).style.display = "none";
  } else {
    document.getElementById(loadingDivId).style.display = "none";
    document.getElementById(mainDivId).style.display = "block";
  }
}
function toTuple({ y, x }) {
  return [y, x];
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */


export function classify(keypoints, tolerance = 30, max_dist = 0.05*480) {
  const facing_right = facing_dir(keypoints);
  const label = [0, 0, 0, 0, 0, 0, 0]; // straight, legs_apart, legs bend, elbows_bend, sholder_bend, hip_bend, hollowback

  // angles right
  const angleKneeRight = get_angle(keypoints[16], keypoints[14], keypoints[12], facing_right);
  const angleHipRight = get_angle(keypoints[14], keypoints[12], keypoints[6], facing_right);
  const angleSholderRight = get_angle(keypoints[12], keypoints[6], keypoints[8], facing_right);
  const angleElbowRight = get_angle(keypoints[6], keypoints[8], keypoints[10], facing_right);
  // angles left
  const angleKneeLeft = get_angle(keypoints[15], keypoints[13], keypoints[11], facing_right);
  const angleHipLeft = get_angle(keypoints[13], keypoints[11], keypoints[5], facing_right);
  const angleSholderLeft = get_angle(keypoints[11], keypoints[5], keypoints[7], facing_right);
  const angleElbowLeft = get_angle(keypoints[5], keypoints[7], keypoints[9], facing_right);

  console.log("angleKneeRight  "+angleKneeRight)
  console.log("angleHipRight  "+angleHipRight)
  console.log("angleSholderRight  "+angleSholderRight)
  console.log("angleKneeLeft  "+angleKneeLeft)
  console.log("angleHipLeft  "+angleHipLeft)
  console.log("angleSholderLeft  "+angleSholderLeft)
  console.log("angleElbowLeft  "+angleElbowLeft)

  
  if (angleKneeRight > 180+tolerance*2 || angleKneeLeft > 180+tolerance*2) {
    label[2] = 1;        //legs_bend
} else if ((keypoints[15].x-keypoints[16].x) > max_dist || (keypoints[15].x-keypoints[16].x) < -max_dist) {
    label[1] = 1;        //legs_apart
} else if (angleElbowRight > 180+tolerance*2 || angleElbowLeft > 180+tolerance*2) {
    label[3] = 1;        //elbows_bend
} else if (angleHipRight > 180+tolerance/1.5 || angleHipLeft > 180+tolerance/1.5) {
    label[6] = 1;        //hollowback
} else if (angleSholderRight > 180+tolerance || angleSholderLeft > 180+tolerance) {
    label[6] = 1;        //hollowback  
} else if (angleHipRight < 180-tolerance/1.75 || angleHipLeft < 180-tolerance/1.75) {
    label[5] = 1;        //hip_bend  
} else if (angleSholderRight < 170-tolerance || angleSholderLeft < 170-tolerance) {
    label[4] = 1;        //shoulder_bend  
} else {
    label[0] = 1;        //straight
}
  return label;
  }

export function facing_dir(keypoints) {
  //0=chest faces left / 1=chest faces right
  if (keypoints[0].x < keypoints[1].x || keypoints[0].x < keypoints[2].x) {
      return 0;
  } else if (keypoints[0].x > keypoints[1].x || keypoints[0].x > keypoints[2].x) {
      return 1;
  }
}
export function get_angle(point_1, point_2, point_3, facing) {
  
  let vector_21 = [point_2.x-point_1.x, point_2.y-point_1.y];
  let vector_23 = [point_2.x-point_3.x, point_2.y-point_3.y];
  //console.log(vector_21);
  let cross_product = vector_21[0]*vector_23[1] - vector_21[1]*vector_23[0];
  let dot_product = vector_21[0]*vector_23[0] + vector_21[1]*vector_23[1];
  
  let abs_vector_21 = Math.sqrt(vector_21[0]**2 + vector_21[1]**2);
  let abs_vector_23 = Math.sqrt(vector_23[0]**2 + vector_23[1]**2);
  
  let sign = Math.atan2(cross_product,dot_product);
  let angle = Math.acos(dot_product/(abs_vector_21*abs_vector_23));
  angle = angle * 180 / Math.PI;
  //0=fingers point to the right / 1=fingers point to the left
  if (facing === 1) {
      if (sign < 0) {
          angle = 360-angle;
      }
  } else {
      if (sign > 0) {
          angle = 360-angle;
      }
  }
  return angle;
}

export function mirrorKeypoints(keypoints, width) {
  console.log(keypoints);
  return keypoints.map(point => {
    // x-Koordinate des Keypoints spiegeln
    point.x = width - point.x;
    return point;
  });
}
/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {

  const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  //console.log(keypoints[0].score)
  adjacentKeyPoints.forEach(([i, j]) => {

    const kp1 = keypoints[i];
    const kp2 = keypoints[j]; 
    

    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;

    if (score1 >= minConfidence && score2 >= minConfidence) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.strokeStyle = color;
      ctx.stroke();
      }});
}

/**
 * Draw pose keypoints onto a canvas
 */
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }
    //console.log(keypoint)
    const { y, x } = keypoint;


    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */


/**
 * Converts an arary of pixel data into an ImageData object
 */
export async function renderToCanvas(a, ctx) {
  const [height, width] = a.shape;
  const imageData = new ImageData(width, height);

  const data = await a.data();

  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    const k = i * 3;

    imageData.data[j + 0] = data[k + 0];
    imageData.data[j + 1] = data[k + 1];
    imageData.data[j + 2] = data[k + 2];
    imageData.data[j + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw an image on a canvas
 */
export function renderImageToCanvas(image, size, canvas) {
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
}

/**
 * Draw heatmap values, one of the model outputs, on to the canvas
 * Read our blog post for a description of PoseNet's heatmap outputs
 * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
 */
export function drawHeatMapValues(heatMapValues, outputStride, canvas) {
  const ctx = canvas.getContext("2d");
  const radius = 5;
  const scaledValues = heatMapValues.mul(tf.scalar(outputStride, "int32"));

  drawPoints(ctx, scaledValues, radius, color);
}

/**
 * Used by the drawHeatMapValues method to draw heatmap points on to
 * the canvas
 */
function drawPoints(ctx, points, radius, color) {
  const data = points.buffer().values;

  for (let i = 0; i < data.length; i += 2) {
    const pointY = data[i];
    const pointX = data[i + 1];

    if (pointX !== 0 && pointY !== 0) {
      ctx.beginPath();
      ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

/**
 * Draw offset vector values, one of the model outputs, on to the canvas
 * Read our blog post for a description of PoseNet's offset vector outputs
 * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
 */
// export function drawOffsetVectors(
//     heatMapValues, offsets, outputStride, scale = 1, ctx) {
//   const offsetPoints =
//       posenet.singlePose.getOffsetPoints(heatMapValues, outputStride, offsets);

//   const heatmapData = heatMapValues.buffer().values;
//   const offsetPointsData = offsetPoints.buffer().values;

//   for (let i = 0; i < heatmapData.length; i += 2) {
//     const heatmapY = heatmapData[i] * outputStride;
//     const heatmapX = heatmapData[i + 1] * outputStride;
//     const offsetPointY = offsetPointsData[i];
//     const offsetPointX = offsetPointsData[i + 1];

//     drawSegment(
//         [heatmapY, heatmapX], [offsetPointY, offsetPointX], color, scale, ctx);
//   }
// }
