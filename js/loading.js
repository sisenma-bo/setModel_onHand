import {main,predict} from "./handDetection.js";
import { setupVRScene,animateVR } from "./createVRview.js";

let nowProgress=0;

/**
 *  ロード画面の生成～削除
 */
export async function createLoadDisplay(){
    //loadDispの設定
    const loadDisp=document.createElement("div");
    loadDisp.id="loading";
    loadDisp.style.position="absolute";
    loadDisp.style.backgroundColor="#39C5BB";
    loadDisp.style.width=window.innerWidth+'px';
    loadDisp.style.height=window.innerHeight+'px';
    loadDisp.style.alignContent='center';
    loadDisp.style.textAlign='center';
    loadDisp.style.zIndex="1000";
    document.querySelector('body').prepend(loadDisp);
    //canvasの設定
    const canvasText=document.createElement("canvas");
    const canvas=document.createElement("canvas");
    const ctx=canvasText.getContext("2d");
    const progressBar=canvas.getContext("2d");
    
    canvas.style.width="80%";
    canvas.style.maxWidth="500px";
    canvas.style.height="15px";
    canvas.style.borderRadius="10px";
    const totalWidth = canvas.width;
    loadDisp.appendChild(canvasText);
    loadDisp.appendChild(document.createElement("br"));
    loadDisp.appendChild(canvas);

    //文字の設定
    ctx.font="30px Trebuchet MS";
    ctx.fillStyle="white";
    let text="Now Loading"
    ctx.fillText(text,50,100);
    const textId=setInterval(()=>{
        ctx.clearRect(0,0,canvasText.width,canvasText.height);
        if(text==="Now Loading..."){
            text="Now Loading";
        }
        else{
            text=text+".";
        }
        ctx.fillText(text,50,100);
    },600);
    //背景バー
    progressBar.fillStyle = 'black';
    progressBar.fillRect(0, 0, totalWidth, canvas.height);

    //進捗バー(progressBar)
    progressBar.fillStyle = '#ff089c'; // 緑色のバー
    /**
     * 進捗バー(progressBar)の進捗処理
     * @param {int} progress 進み具合(%)
    */
    async function loadingProgress(progress){
        return new Promise((resolve) => {
            const progressId = setInterval(() => {
                nowProgress++;
                // 描画処理
                progressBar.fillRect(0, 0, totalWidth * (nowProgress / 100), canvas.height);
                // インターバルを止めて「完了(resolve)」を呼ぶ
                if (nowProgress >= progress) {
                    clearInterval(progressId);
                    clearInterval(textId);
                    ctx.clearRect(0,0,canvasText.width,canvasText.height);
                    ctx.fillText("Complete！！",50,100);
                    resolve();
                }
            }, 30);
        });
    }

    // カメラの読み込み
    await main().catch(error=>{
        console.log(error);
        throw error;
    });
    // setupVRScene();
    await loadingProgress(100);
    predict();

    // 3dモデルの読み込み（予定）
           
    
    // textaliveの読み込み？ 
    
    
    
    //読み込み完了処理
    await deleteElement(loadDisp,2000);
    
    // predict();
    // document.querySelector("video").style.display="none";
    // document.querySelector("#gltf").style.display="none";
    document.querySelector("#gltf").style.top=0;
    document.querySelector("#gltf").style.left=0;
}

async function deleteElement(element,time) {
    return new Promise(resolve=>{
        console.log("実行開始");
        setTimeout(()=>{
            element.remove();
            resolve();
        },time);
    })
    
}



window.addEventListener("resize", () => {
    const loadDisp=document.querySelector("#loading"); 
    if(loadDisp){
        loadDisp.style.width=window.innerWidth+'px';
        loadDisp.style.height=window.innerHeight+'px';
    }  
});