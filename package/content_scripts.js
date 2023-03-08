"use strict";{const renderingModeList=["crisp-edges","pixelated","smooth","high-quality"];const defaultState={scale:100,rotate:"0deg",reverse:false,render:"crisp-edges",input:{rotate:null,scale:null,reverse:null,render:null}};const state={imageElement:null,content:null,contentShadowRoot:null,map:new Map,spaceElement:document.createElement("image-space-element"),contentStyle:(()=>{const style=document.createElement("style");style.textContent=`
        img {
          position: absolute !important;
          inset: 0 !important;
          margin: auto !important;
        }
        image-space-element {
          display: block !important;
          position: relative !important;
        }
      `;return style})()};const dialog=document.createElement("dialog");const attributeNamePrefix="data-image-control-";const resolveTarget=target=>{if(target===null||!(target instanceof HTMLElement)){return null}if(state.imageElement instanceof HTMLImageElement&&dialog.contains(target)){return state.imageElement}if(target instanceof HTMLImageElement){return target}const childrenImages=target.querySelectorAll("img");if(childrenImages.length===1){return childrenImages[0]}const imagesFromParent=target.parentElement?.querySelectorAll("img");if(imagesFromParent?.length===1){return imagesFromParent[0]}return null};const setAttribute=({type,value,isToggle=false})=>{const{imageElement:img}=state;if(img===null){return}if(value===""||isToggle&&img.hasAttribute(`${attributeNamePrefix}${type}`)){img.removeAttribute(`${attributeNamePrefix}${type}`)}else{img.setAttribute(`${attributeNamePrefix}${type}`,`${type}(${value})`)}};const transform=({menuItemId},fromDialogUI)=>{const{imageElement:img,spaceElement}=state;if(!(img instanceof HTMLImageElement)){return true}const imgState=state.map.get(img);const oldScale=imgState?.scale??1;const isInDialog=state.contentShadowRoot?.contains(img);switch(menuItemId){case"reset":spaceElement.removeAttribute("style");return reset(img);case"reset-all":{const nodeList=document.querySelectorAll("[data-image-control-default-style]");nodeList.forEach(img=>{reset(img)});spaceElement.removeAttribute("style");return true}case"reverse":if(imgState){imgState.reverse=!imgState.reverse}setAttribute({type:"rotateY",value:"180deg",isToggle:true});break;case"dialog":openDialog(img);return true;default:{if(imgState){if(menuItemId.startsWith("render:")){const argument=menuItemId.replace("render:","");const value=renderingModeList.find(item=>item===argument);if(value){imgState.render=value;setAttribute({type:"render",value:imgState.render})}}else if(menuItemId.endsWith("%")){imgState.scale=Number(menuItemId.replace(/[^0-9.]/g,""));if(isInDialog){setAttribute({type:"scale",value:imgState.scale})}else{setAttribute({type:"scale",value:imgState.scale/100})}}else if(menuItemId.endsWith("deg")){imgState.rotate=menuItemId;setAttribute({type:"rotateZ",value:imgState.rotate})}}break}}const transformValues=[...img.attributes].map(({name,value})=>{console.log(value);if(name!=="data-image-control-default-style"&&name.startsWith(attributeNamePrefix)&&(!isInDialog||!name.startsWith(`${attributeNamePrefix}scale`))&&!name.startsWith(`${attributeNamePrefix}render`)){return value}return""}).filter(Boolean);img.style.transform=transformValues.join(" ");if(isInDialog){if(!imgState){return}const getSize=scale=>{const width=img.naturalWidth*(scale/100);const height=img.naturalHeight*(scale/100);const diagonal=Math.hypot(width,height);const min=diagonal+20;const contentWidth=(state.content?.clientWidth??0)*2-width;const contentHeight=(state.content?.clientHeight??0)*2-height;return{width:width,height:height,spaceSize:{width:Math.max(min,contentWidth),height:Math.max(min,contentHeight)}}};const{scale,render}=imgState;const{width,height,spaceSize}=getSize(scale);const olsSpaceSize=getSize(oldScale).spaceSize;img.style.width="";img.style.height="";img.style.imageRendering="";img.style.cssText=`
          ${img.getAttribute("style")}
          width: ${width}px !important;
          height: ${height}px !important;
          image-rendering: ${render} !important;
        `;state.spaceElement.style.cssText=`
          width: ${spaceSize.width}px !important;
          height: ${spaceSize.height}px !important;
        `;if(state.content&&state.imageElement){const diffWidth=(olsSpaceSize.width-spaceSize.width)/2;const diffHeight=(olsSpaceSize.height-spaceSize.height)/2;const{scrollTop,scrollLeft}=state.content;if(menuItemId.endsWith("%")){state.content.scroll({top:scrollTop-diffHeight,left:scrollLeft-diffWidth})}}}if(dialog.open&&fromDialogUI!==true){openDialog(img)}return true};const getSrcSet=srcsetValue=>{if(!srcsetValue.trim()){return""}const srcset=srcsetValue.split(",").map(src=>src.trim());return srcset.map(value=>{const array=value.split(/\s/);const ratio=array.pop();const url=array.join("");return`
        <tr>
          <th><label for="${attributeNamePrefix}info-srcset-${ratio}">srcset ${ratio}</label></th>
          <td>
            <span>
              <input
                id="${attributeNamePrefix}info-srcset-${ratio}"
                value="${url}"
                readonly
              />
            </span>
          </td>
        </tr>
      `}).join("")};const getTransformUI=()=>{const imgState=state.imageElement?state.map.get(state.imageElement):null;if(!imgState){return""}return[{name:"scale",unit:"%",min:1,step:1,value:imgState.scale,valueForState:`scale(${imgState.scale/100})`},{name:"rotate",unit:"deg",step:1,min:-360,max:360,value:`${imgState.rotate.replace(/[^0-9]/g,"")}`,valueForState:`rotateZ(${imgState.rotate})`}].map(({name,unit,step,min,max,value,valueForState})=>{return`
        <tr>
          <th><label for="${attributeNamePrefix}info-change-${name}">Change ${name}</label></th>
          <td>
            <span>
              <input
                type="number"
                name="${name}"
                id="${attributeNamePrefix}info-change-${name}"
                value="${value}"
                data-value="${valueForState}"
                ${(step&&`step="${step}"`)??""}
                ${(min&&`min="${min}"`)??""}
                ${(max&&`max="${max}"`)??""}
                class="right"
              />
              ${unit}
            </span>
          </td>
        </tr>
      `}).join("")};const openDialog=(()=>{const content=document.createElement("div");const contentShadowRoot=content.attachShadow({mode:"closed"});const informationTable=document.createElement("table");const wheelEventHandler=e=>{const img=state.imageElement;const isRotate=e.shiftKey;const imgState=img?state.map.get(img):null;e.preventDefault();if(!imgState){return}const scaleInput=imgState.input.scale;const rotateInput=imgState.input.rotate;if(!scaleInput||!rotateInput){return}let scaleValue=imgState.scale;let rotateValue=parseInt(imgState.rotate,10);if(isRotate){const rotate=direction=>{if(direction==="right"){rotateValue+=10}else{rotateValue-=10}if(360<=rotateValue){rotateValue-=360}if(rotateValue<0){rotateValue+=360}const menuItemId=`${rotateValue}deg`;rotateInput.value=String(rotateValue);rotateInput.dataset.value=menuItemId;transform({menuItemId:menuItemId},true)};rotate(e.deltaY<0?"right":"left");return}const zoom=type=>{if(type==="in"){if(scaleValue===1){scaleValue=10}else{scaleValue+=10}}else{scaleValue-=10;if(scaleValue<=0){scaleValue=1}}const menuItemId=`${scaleValue}%`;scaleInput.value=String(scaleValue);scaleInput.dataset.value=menuItemId;transform({menuItemId:menuItemId},true)};zoom(e.deltaY<0?"in":"out")};const getNewImage=originalImage=>{const img=document.createElement("img");for(const{name,value}of originalImage.attributes){if(name==="src"||name==="alt"||name==="style"||name.startsWith(attributeNamePrefix)){img.setAttribute(name,value)}}return img};const createDialog=()=>{const style=document.createElement("style");const information=document.createElement("div");const informationShadowRoot=information.attachShadow({mode:"closed"});const informationStyle=document.createElement("style");state.content=content;state.contentShadowRoot=contentShadowRoot;dialog.id=`${attributeNamePrefix}style`;dialog.tabIndex=0;content.id=`${attributeNamePrefix}style-content`;information.id=`${attributeNamePrefix}style-information`;style.textContent=`
        #${attributeNamePrefix}style {
          position: fixed !important;
          inset: 0px !important;
          margin: auto !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
          max-width: calc(100% - 20px) !important;
          max-height: calc(100% - 20px) !important;
          color: #fff !important;
          background: #282828 !important;
          visibility: visible !important;
          overflow: hidden !important;
          opacity: 1 !important;
          box-sizing: border-box !important;
        }
        #${attributeNamePrefix}style:not([open]) {
          display: none !important;
        }
        #${attributeNamePrefix}style-content,
        #${attributeNamePrefix}style-information {
          height: 100% !important;
        }
        #${attributeNamePrefix}style-content {
          display: grid !important;
          place-items: center !important;
          max-height: 80% !important;
          overflow: scroll !important;
          cursor: move !important;
        }
        #${attributeNamePrefix}style-information {
          padding: 10px !important;
          background: #535353 !important;
          border: 2px solid #424242 !important;
          box-sizing: border-box !important;
          max-height: 20%;
          overflow: auto !important;
        }

        @media (orientation: landscape) {
          #${attributeNamePrefix}style {
            display: grid !important;
            grid-template-columns: 1fr minmax(330px, 400px);
          }

          #${attributeNamePrefix}style-content {
            max-height: none !important;
          }

          #${attributeNamePrefix}style-information {
            max-height: none;
          }
        }
      `;informationStyle.textContent=`
        input,
        select {
          padding: 10px 4px;
          flex-grow: 1;
          color: inherit;
          font-size: inherit;
          line-height: inherit;
          background: transparent;
          border: 0;
          outline: none;
        }
        input[type="checkbox"] {
          height: 19px;
          margin: 10px 0 10px 10px;
        }
        select {
          width: 100%;
        }
        option  {
          color: #333;
        }
        ::-webkit-outer-spin-button,
        ::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        p:has(button) {
          margin: 0 0 1em;
          text-align: right;
        }
        button {
          padding: 10px;
        }
        table {
          width: 100%;
          font-size: 1rem;
        }
        th,
        td {
          text-align: left;
          padding: 4px 0;
        }
        th {
          padding-right: 10px;
          font-weight: normal;
        }
        td > span {
          display: flex;
          align-items: baseline;
          padding-right: 10px;
          background: #464646;
          border-bottom: 1px solid #eee;
        }
        td > span:focus-within {
          outline: 2px solid #fff;
        }
        .right {
          text-align: right;
        }
      `;dialog.appendChild(content);dialog.appendChild(information);informationShadowRoot.appendChild(informationStyle);informationStyle.insertAdjacentHTML("afterend",`
          <p>
            <button type="button">Close</button>
          </p>
        `);informationShadowRoot.appendChild(informationTable);informationShadowRoot.querySelector("button")?.addEventListener("click",()=>{contentShadowRoot.textContent="";dialog.close()});dialog.addEventListener("keydown",({key})=>{if(key==="ESC"){contentShadowRoot.textContent="";dialog.close()}});const moveState={clientY:0,clientX:0,startY:0,startX:0};const moveHandler=e=>{state.content?.scroll({top:moveState.startY+moveState.clientY-e.clientY,left:moveState.startX+moveState.clientX-e.clientX})};content.addEventListener("mousedown",e=>{e.preventDefault();moveState.clientY=e.clientY;moveState.clientX=e.clientX;moveState.startX=state.content?.scrollLeft??0;moveState.startY=state.content?.scrollTop??0;window.addEventListener("mousemove",moveHandler)});window.addEventListener("mouseup",()=>{window.removeEventListener("mousemove",moveHandler)});window.addEventListener("mouseleave",()=>{window.removeEventListener("mousemove",moveHandler)});document.head.append(style);document.body.append(dialog)};createDialog();return async img=>{if(!img){return}const isInDialog=state.contentShadowRoot?.contains(img);const cloneImage=isInDialog?img:getNewImage(img);const imgState=state.map.get(img);const getFileSize=src=>new Promise(resolve=>{fetch(src,{method:"HEAD"}).then(({headers})=>resolve(headers.get("Content-Length"))).catch(()=>{resolve("unreadable")})});const imgLoad=async src=>{return new Promise(resolve=>{const image=new Image;image.src=src;image.onload=()=>{resolve(0)}})};await imgLoad(img.src);if(!imgState){return}dialog.focus();informationTable.textContent="";informationTable.insertAdjacentHTML("afterbegin",`
          <col style="width: 30%" />
          <col />
          <tbody>
            <tr>
              <th><label for="${attributeNamePrefix}info-url">URL</label></th>
              <td>
                <span>
                  <input
                    id="${attributeNamePrefix}info-url"
                    value="${img.src||img.currentSrc}"
                    readonly
                  />
                </span>
              </td>
            </tr>
            <tr>
              <th><label for="${attributeNamePrefix}info-size">File size</label></th>
              <td>
                <span>
                  <input
                    id="${attributeNamePrefix}info-size"
                    value="${await getFileSize(img.src)}"
                    class="right"
                    readonly
                  />
                  byte
              </span>

              </td>
            </tr>
            <tr>
              <th><label for="${attributeNamePrefix}info-w">Natural width</label></th>
              <td>
                <span>
                  <input
                    id="${attributeNamePrefix}info-w"
                    value="${img.naturalWidth}"
                    class="right"
                    readonly
                  />
                </span>
              </td>
            </tr>
            <tr>
              <th><label for="${attributeNamePrefix}info-h">Natural height</label></th>
              <td>
                <span>
                  <input
                    id="${attributeNamePrefix}info-h"
                    value="${img.naturalHeight}"
                    class="right"
                    readonly
                  />
                </span>
              </td>
            </tr>
            <tr>
              <th><label for="${attributeNamePrefix}info-alt">Alt text</label></th>
              <td>
                <span>
                  <input
                    id="${attributeNamePrefix}info-alt"
                    value="${img.alt}"
                    readonly
                  />
                </span>
              </td>
            </tr>
            ${getSrcSet(img.srcset)}
            ${getTransformUI()}
            <tr>
              <th><label for="${attributeNamePrefix}info-reverse">Reverse</label></th>
              <td>
                <span>
                  <input
                    id="${attributeNamePrefix}info-reverse"
                    type="checkbox"
                    ${imgState.reverse?"checked":""}
                  />
                </span>
              </td>
            </tr>
            <tr>
              <th><label for="${attributeNamePrefix}info-render">Rendering Mode</label></th>
              <td>
                <span>
                  <select
                    id="${attributeNamePrefix}info-render"
                  >
                  ${["crisp-edges","pixelated","smooth","high-quality"].map(value=>{return`
                        <option ${imgState.render===value?"selected":""}>${value}</option>
                      `})}
                  </select>
                </span>
              </td>
            </tr>
          </tbody>
        `);contentShadowRoot.textContent="";contentShadowRoot.append(state.contentStyle);state.spaceElement.textContent="";state.spaceElement.append(cloneImage);contentShadowRoot.append(state.spaceElement);const readonlies=informationTable.querySelectorAll("[readonly]");const wheelHandler=e=>e.stopPropagation();const isImageStateProp=name=>name in imgState;readonlies.forEach(input=>{input.addEventListener("focus",()=>input.select())});informationTable.querySelectorAll('[type="number"]').forEach(input=>{input.addEventListener("wheel",wheelHandler)});informationTable.querySelectorAll(`#${attributeNamePrefix}info-change-scale, #${attributeNamePrefix}info-change-rotate`).forEach(input=>{input.addEventListener("keydown",e=>{e.stopPropagation()});if(isImageStateProp(input.name)){switch(input.name){case"rotate":imgState.input.rotate=input;input.addEventListener("input",()=>{const menuItemId=`${input.value}deg`;input.dataset.value=menuItemId;transform({menuItemId:menuItemId},true)});break;case"scale":imgState.input.scale=input;input.addEventListener("input",()=>{const menuItemId=`${input.value}%`;transform({menuItemId:menuItemId},true)});break;default:break}}});const reverseInput=informationTable.querySelector(`#${attributeNamePrefix}info-reverse`);imgState.input.reverse=reverseInput;reverseInput?.addEventListener("change",()=>{transform({menuItemId:"reverse"},true)});const renderingModeSelect=informationTable.querySelector(`#${attributeNamePrefix}info-render`);imgState.input.render=renderingModeSelect;renderingModeSelect?.addEventListener("change",()=>{transform({menuItemId:`render:${renderingModeSelect.value}`},true)});content.removeEventListener("wheel",wheelEventHandler);content.addEventListener("wheel",wheelEventHandler);if(!dialog.open){dialog.showModal();if(!state.map.has(cloneImage)){state.map.set(cloneImage,{...defaultState,rotate:imgState.rotate,reverse:imgState.reverse})}if(imgState.scale===100&&state.content){const fitHeight=(state.content.offsetHeight-60)/img.naturalHeight;const fitWidth=(state.content.offsetWidth-60)/img.naturalWidth;const result=Math.floor(Math.min(fitHeight,fitWidth)*100);if(result<100){imgState.scale=result}}state.imageElement=cloneImage;transform({menuItemId:`${imgState.scale}%`});if(state.content){const{scrollWidth,offsetWidth,scrollHeight,offsetHeight}=state.content;state.content.scroll({top:(scrollHeight-offsetHeight)/2,left:(scrollWidth-offsetWidth)/2})}}}})();const reset=img=>{const transformNames=[...img.attributes].map(({name})=>{if(name.startsWith(attributeNamePrefix)){return name}return""}).filter(Boolean);img.style.cssText=img.dataset.imageControlDefaultStyle||"";state.map.set(img,{...defaultState});transformNames.forEach(name=>img.removeAttribute(name));transform({menuItemId:`100%`});return true};chrome.runtime.onMessage.addListener(({menuItemId},_,sendResponse)=>{transform({menuItemId:menuItemId},false);sendResponse(true);return true});window.addEventListener("contextmenu",({target})=>{const img=resolveTarget(target);if(!(img instanceof HTMLImageElement)){state.imageElement=null;console.log("Chrome Extension Image Controller: No image");return}if(img){state.imageElement=img;if(!state.map.has(img)){state.map.set(img,{...defaultState})}if(typeof img.dataset.imageControlDefaultStyle!=="string"){img.dataset.imageControlDefaultStyle=img.getAttribute("style")||""}}})}