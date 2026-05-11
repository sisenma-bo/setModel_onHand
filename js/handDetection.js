import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { Loaded,animate } from './gltfLoad.js';
import { createErrorDisplay } from './errorDisplay.js';


//各要素を取得
const video = document.getElementById('webcam');

const gltfCanvas=document.getElementById('gltf');
gltfCanvas.style.position="absolute";
let height = window.innerHeight;
// gltfCanvas.width=window.innerWidth;
// gltfCanvas.height=window.innerHeight;
let loaded;
//カメラの表示領域の調整(window.addEventListenerの追加)
//ずれの原因
video.width=window.innerWidth;
video.height=window.innerHeight;

//検知を制御するための変数
let frameCounter=0;
// 検出器
let detector;

export let landMarkPos;
export let stream;
export let predictId;
/**
 * カメラの設定と起動
 * @returns {Promise} カメラが起動できたか
 */
async function setupWebcam() {
    try{
        stream = await navigator.mediaDevices.getUserMedia({ 
            video:true, 
            audio: false 
        });
        video.srcObject = stream;
        loaded=new Loaded(gltfCanvas);
        return new Promise((resolve)=>{
            video.onloadedmetadata=()=>{
                resolve();
            }
        });
    }
    catch(error){
        // console.error(error.name,error.message);
        let errorText="";
        if (error.name === 'NotAllowedError') {
            errorText="カメラの使用を許可してください";
            alert("カメラの使用を許可してください");
        } 
        else if (error.name === 'NotFoundError') {
            errorText="カメラが見つかりません";
            alert("カメラが見つかりません");
        } 
        else if (error.name === 'NotReadableError') {
            errorText="カメラは他のアプリで使用中です";
            alert("カメラは他のアプリで使用中です");
        }
        console.log("error")
        createErrorDisplay(errorText);
        throw error;
    };
    
}
/**
 * tensorflow.jsのhandPoseDetectionモデル生成の関数
 * 
 */
export async function main() {
    await tf.setBackend('webgl');
    await tf.ready();
    console.log('Camera Loading');
    //検出モデルの初期化
    const model = 'MediaPipeHands';
    // 設定
    const detectorConfig = {
        runtime: 'mediapipe', // 'mediapipe'か'tfjs'
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands`,
        modelType: 'full',
        maxHands:1 //検出可能な手の数(負荷を減らすために最大数は１に設定)

    };
    detector = await handPoseDetection.createDetector(model, detectorConfig);
    console.log('Camera Boot');
    await setupWebcam();
    console.log('Camera Ready');
    // predict();
}
/**
 * 手の検出およびランドマークを見つける
 */
export async function predict() {
    const estimationConfig = {
        staticImageMode: false
    };
    const hands = await detector.estimateHands(video, estimationConfig);

    if (hands.length > 0) {
        hands.forEach(hand => {
            gltfCanvas.style.display = "block";
            const keypoints2D=hand.keypoints;
            const keypoints3D=hand.keypoints3D;
            // console.log(keypoints3D[1].z);
            // 手の平の中心を計算 (親指の付け根と小指の付け根の中間点)
            const thumbBase = keypoints2D[1]; // 親指の付け根
            const pinkyBase = keypoints2D[17]; // 小指の付け根
            const palmCenter = {
                x: (thumbBase.x + pinkyBase.x) / 2,
                y: (thumbBase.y + pinkyBase.y) / 2
            };
            

            // 手の平の中心にgltfCanvasを配置
            const adjustedPosition = adjustement(palmCenter);
            const newX=(adjustedPosition.x/window.innerWidth)*2-1;
            const newY=-(adjustedPosition.y/window.innerHeight)*2+1;
            const depth=keypoints3D?keypoints3D[0].z*-10:-5;
            // gltfCanvas.style.top = adjustedPosition.y - gltfCanvas.height / 3 + "px";
            // gltfCanvas.style.left = adjustedPosition.x - gltfCanvas.width / 3 + "px";
            loaded.modelPosition(newX,newY,depth);
            loaded.updateVisuals(keypoints3D);
            // loaded.syncRotation(keypoints3D);
            animate();
            frameCounter = 0;
        });
    } else {
        frameCounter++;
        if (frameCounter >= 10) {
            landMarkPos = undefined;
            gltfCanvas.style.display = "none";
        }
    }
    predictId = requestAnimationFrame(predict);
}

window.addEventListener('resize',()=>{
    video.width=window.innerWidth;
    video.height=window.innerHeight;
    // gltfCanvas.width=window.innerWidth;
    // gltfCanvas.height=window.innerHeight;

});


/**
 * object-fit:coverで引き延ばされた文を補正
 * @returns 補正後のx,y座標
 */
export function adjustement(position) {
    const x=position.x; // 検出したランドマークのx座標
    const y=position.y; // 検出したランドマークのy座標
  
    const displayWidth=video.clientWidth;
    const displayHeight=video.clientHeight;
    const originalWidth=video.videoWidth;
    const originalHeight=video.videoHeight;
  
    const scale = Math.max(
      displayWidth/originalWidth,
      displayHeight/originalHeight
    );
  
    // 補正後の座標を計算
    // 計算式 (どのくらい拡大されているか)+(どのくらいはみ出ているか)/左右均等にはみ出る
    const newX=(x*scale)+(displayWidth-originalWidth*scale)/2;
    const newY=(y*scale)+(displayHeight-originalHeight*scale)/2;
  
    return {
      x: newX,
      y: newY
    };
}