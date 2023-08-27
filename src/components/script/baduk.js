export const WHITE = "white";
export const BLACK = "red";
export const BOARD_COLOR = "#CCFFCC";
export const CELL_WIDTH = 30;     // 格子宽度 
export const CELL_NUMBER = 18;    // 每行每列格子数
export const PREVIEW_RATIO = 0.75; // 预览窗口占正常窗口的比例
// 棋谱树根
export class Node {
   constructor(ftr, subList, pos, steps) {
     this.ftr = ftr;
     this.subList = subList || [];
     this.pos = pos;
     this.steps = steps;
   }
 }
// 为了实现树状分支，研讨模式下选点(A,B,C...)
export class SelectedPoint{
   constructor(showLetter = false, letter = 'A', posX = 0, posY = 0, outOfRange = false){
     this.showLetter = showLetter;       // 是否显示选点的字母
     this.letter = letter;               // 当前使用的字母 
     this.posX = posX;                   // 字母横坐标   
     this.posY = posY;                   // 字母纵坐标   
     this.outOfRange = outOfRange;       // 字母是否超出棋盘
   }
 }

 // 绘制线条
 export function drawLine(ctx, startX, startY, endX, endY) {
  // 开始绘制路径
  ctx.beginPath();
  // 将起点移动到对应坐标
  ctx.moveTo(startX, startY);
  // 绘制线条到终点
  ctx.lineTo(endX, endY);
  // 设置线条的颜色
  ctx.strokeStyle = BLACK;
  // 绘制线条
  ctx.stroke();
}


// 宽度可调的星位数组
export function getStellas(cellWidth){
  return [         // 星位坐标
    [4 * cellWidth, 4 * cellWidth], [10 * cellWidth, 4 * cellWidth], [16 * cellWidth, 4 * cellWidth],
    [4 * cellWidth, 10 * cellWidth], [10 * cellWidth, 10 * cellWidth], [16 * cellWidth, 10 * cellWidth],
    [4 * cellWidth, 16 * cellWidth], [10 * cellWidth, 16 * cellWidth], [16 * cellWidth, 16 * cellWidth]
  ];
}

// 将Node转换成Json
export function convertNodeToJson(root){
  let res = {};
  let list = root.subList;      
  if (list.length == 0) return "";
  else {
    for (const node of list) {
      res[node.pos] = convertNodeToJson(node);          
    }
  }
  return res;
}

export function convertJsonToNode(jsonStr) {
  const json = JSON.parse(jsonStr);

  function createNodeFromJson(jsonObj, depth, parent = null) {
    const pos = Object.keys(jsonObj)[0].split(",").map(Number);
    const subList = [];
    const currentNode = new Node(parent, subList, pos, depth);
    for (const key in jsonObj[pos]) {
      const childNode = createNodeFromJson({ [key]: jsonObj[pos][key] }, depth + 1, currentNode);
      subList.push(childNode);
    }
    return currentNode;
  }

  return createNodeFromJson(json, 1);
}   

  // 深层复制对象
  export function deepCopy(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    const copiedObj = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
      copiedObj[key] = deepCopy(obj[key]);
    }
    return copiedObj;
  }

  export function showBoard(cellNumber, boardArr){
    let str = '';
    for (let i = 0; i <= cellNumber; i++){
      for (let j = 0; j <= cellNumber; j++){
        let s = boardArr[i][j] === -1 ? 'x' : boardArr[i][j];
        str += s + ',';
      }
      str += '\n';
    }
    console.log(str);
  }
