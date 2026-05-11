import * as THREE from "three";
import modelUrl from "../gltf/magicalmirai2022_test02.glb";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import { createErrorDisplay } from "./errorDisplay.js";
import { stream } from "./handDetection.js";


//three.jsで使用する変数の宣言
let renderer,scene,camera,light,model;
const vWrist = new THREE.Vector3();
const vIndex = new THREE.Vector3();
const vPinky = new THREE.Vector3();

const vUp = new THREE.Vector3();
const vSide = new THREE.Vector3();
const vNormal = new THREE.Vector3();
const rotationMatrix = new THREE.Matrix4();


const cameraDir = new THREE.Vector3(0, 0, -1); // カメラの正面
let arrowHelper;
// export let model;
//blenderで作成した3Dモデルのクラス
export class Loaded{
    constructor(canvas){
        // sceneを生成
        scene=new THREE.Scene();
        // cameraを生成
        camera = new THREE.PerspectiveCamera(75, 1/1, 0.1, 1000);
        //カメラの位置を調整
        scene.background=stream?new THREE.VideoTexture(stream):new THREE.Color("#39C5BB");
        camera.position.set(0, 0, 0);
        //常に原点を見るようにする
        camera.lookAt(0, 0, 0);
        // GLTFLoaderを生成
        this.loader=new GLTFLoader();
        this.loader.load(modelUrl,
            function (gltf) {
                model = gltf.scene;
                model.scale.set(0.3, 0.3, 0.3);
                model.rotation.y=Math.PI/2;
                console.log("読み込み完了");
                scene.add(model);
                console.log(model.position);
                //modelの色を変える処理
                // model.traverse((child) => {
                //     if (child.isMesh) {
                //       // 既存のテクスチャを維持しつつ色味を変更する例
                //       child.material.color.set(0xff0000); // 赤色に変更
                      
                //       // 必要に応じてマテリアルの設定を調整
                //     }
                //   });
                console.log(model.name);
            },
            //読み込んでいるときの処理
            function (){
                console.log('読み込み中');
            },
            //エラーが起きた時の処理
            function (error){
                createErrorDisplay("3Dモデルの読み込みに失敗しました");
                console.error('予期せぬエラーが発生しました:',error);
            }
        );
        //renderer生成+設定
        renderer=new THREE.WebGLRenderer({
            canvas:canvas,
            antialias:true,
            alpha:true
        });
        renderer.setSize(window.innerWidth,window.innerHeight,true);
        renderer.setPixelRatio(window.devicePixelRatio);
        //光源生成
        light=new THREE.AmbientLight("#ffffff",10);
        scene.add(light);
        //コントローラー生成
        // controls=new OrbitControls(camera,renderer.domElement);

        const dir = new THREE.Vector3(0, 1, 0); // 初期方向
        const origin = new THREE.Vector3(0, 0, 0); // 初期位置
        const length = 2; // 矢印の長さ
        const hex = 0x00ff00; // 矢印の色（緑色）
    
        arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
        scene.add(arrowHelper);
    }
    /**
     * modelの位置を変える
     * @param {float} x 画面の手のx座標  
     * @param {flaot} y 画面の手のy座標
     * @param {float} z 深度
     */
    modelPosition(x,y,z){
        const vector=new THREE.Vector3(x,y,0);
        vector.unproject(camera);

        const dir = vector.sub(camera.position).normalize();
        // カメラからの基本距離 + 手の前後移動
        const distance = 10 + z; 
        const newPos = camera.position.clone().add(dir.multiplyScalar(distance));
        //書き換え
        // model.position.copy(newPos);
        model.position.copy(newPos);
        arrowHelper.position.copy(newPos);
        // console.log(model.position);
    }
    /**
     * @param {Array} kp3D 
     */
    updateVisuals(kp3D) {
        // 座標の取得
        const p0 = new THREE.Vector3(kp3D[0].x, kp3D[0].y, kp3D[0].z);  // 手首
        const p5 = new THREE.Vector3(kp3D[5].x, kp3D[5].y, kp3D[5].z);  // 人差し指付け根
        const p17 = new THREE.Vector3(kp3D[17].x, kp3D[17].y, kp3D[17].z); // 小指付け根

        // ベクトルの計算 
        const v1 = new THREE.Vector3().subVectors(p5, p0);
        const v2 = new THREE.Vector3().subVectors(p17, p0);
        
        // 正面方向 (手のひらの法線)
        const vNormal = new THREE.Vector3().crossVectors(v2, v1).normalize();
        
        // 上方向 (手首から中指方向への目安として)
        const vUp = new THREE.Vector3().addVectors(v1, v2).normalize();
        
        // 横方向 (右左の軸を直交させる)
        const vSide = new THREE.Vector3().crossVectors(vUp, vNormal).normalize();

        // 回転行列の構築
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeBasis(vUp,vNormal,vSide);

        // クォータニオン変換とLerp(slerp)
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
        console.log(targetQuaternion);
        model.quaternion.slerp(targetQuaternion, 0.1); 
        // model.rotation.y=0;
        // (デバッグ用) ArrowHelperにも同期
        if (arrowHelper) {
            arrowHelper.setDirection(vNormal);
            // 位置もモデルに合わせる場合はここで arrowHelper.position.copy(...)
        }
        // model.setDirection(vNormal);
        // 見えにくい場合は長さを大きくする
        arrowHelper.setLength(5, 1, 0.5);
    }
}
export function animate(){
    // model.rotation.y+=0.01;
    renderer.render(scene,camera);
}

const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const normal = new THREE.Vector3();

/**
 * 
 * @param {object} landmarks
 * @returns {object} 
 */
export function getPalmNormal(landmarks) {
    // ランドマークをVector3に変換
    const p0 = new THREE.Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);
    const p5 = new THREE.Vector3(landmarks[5].x, landmarks[5].y, landmarks[5].z);
    const p17 = new THREE.Vector3(landmarks[17].x, landmarks[17].y, landmarks[17].z);

    // 2つのベクトルを算出
    vA.subVectors(p5, p0);
    vB.subVectors(p17, p0);

    // 外積で法線を求め、単位ベクトル化
    normal.crossVectors(vA, vB).normalize();
    
    return normal;
}