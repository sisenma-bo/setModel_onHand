import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/Addons.js";

let scene, camera, renderer, controls;
export let setupVRSceneId;
export function setupVRScene() {
    // シーン、カメラ、レンダラーのセットアップ
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = false; // VRモードを無効化
    document.body.appendChild(renderer.domElement);

    // 簡単なオブジェクトを追加
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 1.5, 0); // カメラの前に配置
    scene.add(cube);

    // カメラの初期位置
    camera.position.set(0, 1.6, 5);

    // 床を追加
    const floorGeometry = new THREE.PlaneGeometry(100, 100); // 幅100、高さ100の平面
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // 灰色のマテリアル
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // 平面を水平にする
    floor.position.y = 0; // 床の高さを設定
    scene.add(floor);

    controls = new PointerLockControls(camera, renderer.domElement);

    // pointerdownとpointerupイベントの設定
    renderer.domElement.addEventListener("pointerdown", () => {
        controls.lock(); // カーソルをロックして視点移動を開始
    });

    renderer.domElement.addEventListener("pointerup", () => {
        controls.unlock(); // カーソルのロックを解除して視点移動を終了
    });
    
}
export function animateVR() {
    // シーンの描画
    renderer.render(scene, camera);
    setupVRSceneId=requestAnimationFrame(animateVR);
}
window.addEventListener("resize", () => {
    if(camera){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

});

