/**
 * 
 * @param {string} errortext エラー発生時に表示するテキスト
 */
export function createErrorDisplay(errorText){ 
    const errorDisp=document.createElement("div");
    errorDisp.id="error";
    errorDisp.style.position="absolute";
    errorDisp.style.backgroundColor="#39C5BB";
    errorDisp.style.width=window.innerWidth+'px';
    errorDisp.style.height=window.innerHeight+'px';
    errorDisp.style.alignContent='center';
    errorDisp.style.textAlign='center';
    errorDisp.style.zIndex="9999";
    document.querySelector('body').prepend(errorDisp);
    const canvasText=document.createElement("canvas");
    const ctx=canvasText.getContext("2d");
    errorDisp.appendChild(canvasText);
    ctx.font="20px Trebuchet MS";
    ctx.fillStyle="white";
    ctx.fillText(errorText,0,100);
}
window.addEventListener("resize",()=>{
    const errorDisp=document.getElementById("error");
    if(errorDisp){
        errorDisp.style.width=window.innerWidth+'px';
        errorDisp.style.height=window.innerHeight+'px';
    }  
});