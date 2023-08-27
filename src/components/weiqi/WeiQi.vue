<template>
  <div>
    <canvas ref="canvas" :width="canvasSize" :height="canvasSize" @mousemove="onMouseMove" @mouseup="onMouseUp"></canvas>
    <div class="follow-letter" v-if="selectedPoint.showLetter" :style="{ top: selectedPoint.posY + 'px', left: selectedPoint.posX + 'px' }">{{ selectedPoint.letter }}</div>
  </div>
</template>

<script>
  // 导入数据
  import {
    WHITE,
    BLACK,
    BOARD_COLOR,
    CELL_WIDTH,
    CELL_NUMBER,
    Node,
    SelectedPoint,
    PREVIEW_RATIO
  } from "../script/baduk"

  // 导入函数
  import {
    drawLine,
    getStellas,
    convertNodeToJson,
    showBoard,
  } from "../script/baduk"

  // 棋盘格子大小
  let cellWidth = CELL_WIDTH;
  // 棋盘格子数
  let cellNumber = CELL_NUMBER;
  // 装有星位的数组
  let stellae = getStellas(cellWidth);
  console.log(stellae);



  // 左右上下 四个方向
  let directions = [    
    [0, -1], [0, 1], [-1, 0], [1, 0]
  ];
  
  export default {
    props:{
      // 用来变相实现event接收
      pData:[],   
    },
    watch:{
      pData(n, o){
        this.$nextTick(() => {
          console.log(o + " -> " + n);
          this.handleCustomEvent(this.pData[0], this.pData[1]);
        });
      }
    },
    data() {
      return {
        canvasSize: cellWidth * cellNumber + 2.7 * cellWidth,
        lineLength: cellWidth * cellNumber,   // 线条长度
        lineThickness: 0.8,                   // 线条粗细
        gridColor: BLACK,                     // 格子颜色
        boardColor: BOARD_COLOR,              // 棋盘颜色
        mouseX: 0,              
        mouseY: 0,              
        currentColor: true,                   // 当前棋子颜色，true：黑子，false：白子
        radius: cellWidth / 2,                // 棋子半径
        
        stepsOn: true,                       // 标记是否显示手数
        curSteps: 0,                         // 当前手数
        
        deduceMode: false,                    // 是否开启研讨模式
        textOfDeduceBtn: '开启研讨',          // “开启研讨”按钮文本
        // 为了实现树状分支，研讨模式下选点(A,B,C...)
        selectedPoint: new SelectedPoint,
        curNode: this.root,                        // 当前所处分支

        popOfSavingVisible: false,             // "保存棋谱"组件是否可见
        manualName: '',                       // 棋谱名

        readPreviewVisible: false,            // "预览棋谱"组件是否可见
          
        boardArr: [],                         // 初始化棋盘(核心运算用)          
        lastToDie: [],                        // 最近将死之棋
        kalpa: false,                         // 打劫相关标记          
        positions: [],                        // 记录每步棋的位置，用于处理劫材相关问题
        killers: [],                          // 杀死棋子的killers，恢复死子时killers.pop()
        stoneBeforeDeduction: null,           // 研讨前的一颗棋子        
        root: new Node(null, [], [], 0),      // 根节点
      };
    },
    mounted() {
      //如果是预览页面调用此组件，则更改canvas尺寸
      if (this.pData !== undefined){
        cellWidth = CELL_WIDTH * PREVIEW_RATIO;
        stellae = getStellas(cellWidth);
        this.canvasSize *= PREVIEW_RATIO;
        this.lineLength *= PREVIEW_RATIO;
        this.radius *= PREVIEW_RATIO;
      }

      this.draw();
      this.$parent.$on('weiqi-event', this.handleCustomEvent);
    },
    // 虽然vue实例对象是各自独立，但是本文件的外部变量是共有的
    // 所以，预览窗口关闭后，需要还原canvas尺寸
    beforeDestroy(){
      console.log("DestroyDestroyDestroyDestroy");
      cellWidth = CELL_WIDTH;
      stellae = getStellas(cellWidth);
      this.canvasSize = cellWidth * cellNumber + 2.7 * cellWidth;
      this.lineLength = cellWidth * cellNumber;
      this.radius = cellWidth / 2;
    },
    beforeUnmount() {
      this.$parent.$off('weiqi-event', this.handleCustomEvent);
    },
    methods: {
      handleCustomEvent(functionName, param) {
        // console.log('接收到：', functionName + " : " + JSON.stringify(param));
        // 在这里处理收到的消息
        if (typeof this[functionName] === 'function') {
          console.log("确定是函数");
          this[functionName](param);
        } else {
          console.log('未找到对应的方法');
        }
      },
      // 绘制棋盘
      draw() {
        console.log(this.root);
        // 获取 canvas 元素
        const canvas = this.$refs.canvas;
        // 获取 2D 绘图上下文
        const ctx = canvas.getContext("2d");
        // 清空画布
        ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
        
        // 棋盘背景色
        ctx.fillStyle = this.boardColor;
        ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        this.initBoard(ctx);       
      },
      // 绘制树状图中的棋子
      drawStoneInTree(ctx, cntrX, cntrY, radius){
        // 若是落子位置超出限制，禁止落子
        if (cntrX < this.radius || cntrY < this.radius || cntrX > this.canvasSize - this.radius || cntrY > this.canvasSize - this.radius) return;      
        // 若是盘面存在棋子，禁止落子
        let row = cntrY / cellWidth - 1;
        let col = cntrX / cellWidth - 1;
        if (this.boardArr[row][col] != 0) return;
            
        // 棋子颜色
        let stoneColor;
        if (this.currentColor) stoneColor = BLACK;
        else stoneColor = WHITE;

        // 绘制圆圈
        ctx.beginPath();
        // 针对白子，半径-0.5使得加上边框后跟黑子一样大
        if (stoneColor == WHITE) radius -= 0.5;  
        ctx.arc(cntrX, cntrY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = stoneColor;
        ctx.fill();

        if (stoneColor === WHITE){
          // 给白色棋子添加红色边框
          ctx.lineWidth = 1;
          ctx.strokeStyle = BLACK;
          ctx.stroke();
        }

        // 绘制棋子上的数字
        let font = cellWidth * 0.4;
        ctx.font = font + 'px Arial';
        // 设置数字颜色
        ctx.fillStyle = this.currentColor ? WHITE : BLACK;     
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.selectedPoint.letter, cntrX, cntrY);

        // 盘面进行标记
        this.boardArr[row][col] = 2;

      },
      
      // 绘制棋子
      drawStone(ctx, cntrX, cntrY, radius){   
        // 若是盘面存在棋子，禁止落子
        let row = cntrY / cellWidth - 1;
        let col = cntrX / cellWidth - 1;
        if (this.boardArr[row][col] != 0) {
          return;
        }
        
        // 记录盘面棋子颜色
        let flg = this.currentColor ? 1 : -1;
        this.boardArr[row][col] = flg;      
        
        
        // 若是落子后整块棋子无气，禁止落子
        if (this.countTheAeresOfBlockOfStones(row, col).aeres == 0) {
          if (!this.checkAndClear(ctx, row, col, false)) {
            this.boardArr[row][col] = 0;
            return;
          }
        }

        // 处理打劫：本次落子不能[只]吃掉最近一次的落子
        if (this.checkAndClear(ctx, row, col, false)) {
          if (this.lastToDie.length == 1) {
            let pos = this.positions[this.positions.length - 1];
            if (this.kalpa && this.lastToDie[0][0] == pos[0] && this.lastToDie[0][1] == pos[1]) {
              this.boardArr[row][col] = 0;
              return;
            }
          }
        }
        // 找到劫材后更新
        this.positions.push([row, col]);
        this.kalpa = false;

        // 棋子颜色
        let stoneColor;
        if (this.currentColor) stoneColor = BLACK;
        else stoneColor = WHITE;

        // 绘制圆圈
        ctx.beginPath();
        // 针对白子，半径-0.5使得加上边框后跟黑子一样大
        if (stoneColor == WHITE) radius -= 0.5;  
        ctx.arc(cntrX, cntrY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = stoneColor;
        ctx.fill();

        if (stoneColor === WHITE){
          // 给白色棋子添加红色边框
          ctx.lineWidth = 1;
          ctx.strokeStyle = BLACK;
          ctx.stroke();
        }
        
        if (this.curNode.subList.length == 0) {
          console.log(("没后续"));
          // 只有在没有后续棋子时新生树枝
          let node = new Node(this.curNode, [], [row, col], this.curNode.steps + 1);
          this.curNode.subList.push(node);
          this.curNode = node;
        } else {
          console.log(("有后续"));
          // 新落子位置是否存在于当前分支中，亦即树结构是否会改变
          let changed = true;
          // 有后续时，将curNode迭代到选中的节点
          for (const node of this.curNode.subList) {
            let pos = node.pos;
            if (pos[0] == row && pos[1] == col) {
              this.curNode = node;
              changed = false;
            }
          }
          if (changed) {
            // 树结构分支变化时，将curNode的subList清空后重新添加新落子
            this.curNode.subList = [];
            let node = new Node(this.curNode, [], [row, col], this.curNode.steps + 1);
            this.curNode.subList.push(node);
            this.curNode = node;
          }
        }
        

        // 仅当“显示手数”打开、或研讨模式打开时绘制
        if (this.stepsOn || this.deduceMode){ 
          // 绘制棋子上的数字
          let font = cellWidth * 0.4; 
          ctx.font = font + 'px Arial';
          // 设置数字颜色
          ctx.fillStyle = this.currentColor ? WHITE : BLACK;     
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (this.deduceMode && this.curNode != this.stoneBeforeDeduction){
            console.log(this.curNode);            
            ctx.fillText((this.curNode.steps - this.stoneBeforeDeduction.steps).toString(), cntrX, cntrY);
          } else {
            ctx.fillText((this.curNode.steps).toString(), cntrX, cntrY);
          }
                      
        }

        // 设定下次落子棋子颜色
        this.currentColor = !this.currentColor;

        // 更新当前手数
        this.curSteps++;        
        if (this.checkAndClear(ctx, row, col)){
          this.killers.push(this.curNode);  
          this.kalpa = true;        
        }
      },
      // 检查落子周边是否存在死子，并清除
      checkAndClear(ctx, row, col, needToClear = true){
        // 最多存在4块死棋
        let blocksNeedToClear = [];
        // 标记是否存在清除死子的情况
        let cleared = false;
        // needToClear可选，设置成false的时候只检查是否存在死子但不清除
        for (const direction of directions) {
          let curRow = row + direction[0];
          let curCol = col + direction[1];
          if (!isLegal(curRow, curCol) ||                     // 位置非法时
              this.boardArr[curRow][curCol] == 0 ||                // 位置上无子时
              this.boardArr[row][col] == this.boardArr[curRow][curCol]  // 周边棋子与当前棋子颜色相同时
              ) continue;
          let curBlock = this.countTheAeresOfBlockOfStones(curRow, curCol);
          if (curBlock.aeres == 0) {
            blocksNeedToClear.push(curBlock);     
            cleared = true;       
          }
        }
        if (blocksNeedToClear.length == 1) this.lastToDie = blocksNeedToClear[0].block;
        if (needToClear) {
          for (const block of blocksNeedToClear) {
            for (const pos of block.block) {
              this.clearStoneByPosition(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth);
            }   
          }
        }

        return cleared;
      },
      // 监听鼠标移动
      onMouseMove(event) {
        const canvas = this.$refs.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // 获取鼠标的坐标
        let x = event.clientX;
        let y = event.clientY;

        this.selectedPoint.posX = x - this.radius;
        this.selectedPoint.posY = y - this.radius;

        // 光标移出canvas时隐藏字母，反之则显示
        // if (deducedStones.length){    // 仅当研讨模式执行
        //   let illegal = x < rect.left + this.radius ||
        //                 x > rect.left + (cellNumber + 1) * cellWidth + this.radius || 
        //                 y < rect.top + this.radius || 
        //                 y > rect.top + (cellNumber + 1) * cellWidth + this.radius;
        //   if (illegal) 
        //     {
        //       this.selectedPoint.showLetter = false;
        //       this.selectedPoint.outOfRange = true;
        //     }
        //   if (!illegal && this.selectedPoint.outOfRange) {
        //     this.selectedPoint.showLetter = true;
        //     this.selectedPoint.outOfRange = false;
        //   }
        // }
      },
      // 监听鼠标key-up
      onMouseUp(event){      
        const canvas = this.$refs.canvas;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        
        // 获取鼠标在Canvas中的相对坐标
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        
        // 若是落子位置超出限制，禁止落子
        if (x < this.radius || y < this.radius || x > (cellNumber + 1) * cellWidth + this.radius || y > (cellNumber + 1) * cellWidth + this.radius) return;   
        
        // 获取盘面坐标
        let row = Math.round(y / cellWidth) - 1;
        let col = Math.round(x / cellWidth) - 1;

        // 判断
        let curPos = this.curNode.pos;
        // 若处于研讨模式，且当前位置为研讨模式下的最后一颗落子时，呼出树状分支
        if (this.deduceMode && curPos[0] == row && curPos[1] == col){          
          this.selectedPoint.showLetter = true;       
          // 树状分支环境下，禁用大跳步
          // this.greatJumpDisabled = true;   
          return;
        }

        // 只有点击分支某个棋子时
        if (this.boardArr[row][col] == 2){                
          // 选取分支上的选点作为curNode
          for (const node of this.curNode.subList) {            
            this.clearStoneByPosition(ctx, (node.pos[1] + 1) * cellWidth, (node.pos[0] + 1) * cellWidth);
            if (node.pos[0] == row && node.pos[1] == col){
              this.curNode = node;              
            }
          }       
                    
          // 更新手数
          this.curSteps++;
          // 由于分支被全部清除，需要重绘当前点击选点棋子
          let curColor = this.currentColor ? BLACK : WHITE;
          let steps = this.deduceMode ? this.curSteps - this.stoneBeforeDeduction.steps : this.curSteps;
          this.redrawStone(ctx, (col + 1) * cellWidth, (row + 1) * cellWidth, this.radius, curColor, steps);          
          this.boardArr[row][col] = this.currentColor ? 1 : -1;
          this.currentColor = !this.currentColor;
          this.curNode.steps = this.curSteps;
// 此处需要调用checkAndClear
          this.checkAndClear(ctx, row, col);


          if (this.curNode.subList.length){
            this.drawBranchesFromSublist(ctx, this.curNode);
            this.selectedPoint.letter = String.fromCharCode(65 + this.curNode.subList.length);
          } else {
            this.selectedPoint.letter = 'A';
          }

          return;
        } // 有棋子时禁止落子
        else if (this.boardArr[row][col] != 0) return;


        // 获取落子坐标
        let IntX = Math.round(x / cellWidth) * cellWidth;
        let IntY = Math.round(y / cellWidth) * cellWidth;
        if (event.button == 0){
          if (this.selectedPoint.showLetter){                       
            // 更新curNode            
            let cur = new Node(this.curNode, [], [row, col]);
            this.curNode.subList.push(cur);
            
            // 绘制树中棋子
            this.drawStoneInTree(ctx, IntX, IntY, this.radius);

          } else{            
            this.drawStone(ctx, IntX, IntY, this.radius); 
          }
        }
         
        if (this.selectedPoint.showLetter){
          // 变更字母
          let ascii = this.selectedPoint.letter.charCodeAt(0);
          ascii++;
          this.selectedPoint.letter = String.fromCharCode(ascii);
        }

        
      },
      // 清空指定位置的棋子
      clearStoneByPosition(ctx, x, y){
        ctx.beginPath();
        
        // 恢复移除棋子导致缺失的棋盘线条
        ctx.fillStyle = this.boardColor;
        ctx.fillRect(x - this.radius, y - this.radius, cellWidth, cellWidth);
        drawLine(ctx, x - this.radius, y, x + this.radius, y);
        drawLine(ctx, x, y - this.radius, x, y + this.radius);

        // 恢复星位
        if (stellae.some(arr => arr.join() === [x, y].join()))     
          this.drawStellam(ctx, x, y);    
        
        // 维护核心计算用的棋盘数组
        let row = y / cellWidth - 1;
        let col = x / cellWidth - 1;
        this.boardArr[row][col] = 0;
      },
      // 绘制星位
      drawStellam(ctx, cntrX, cntrY){
        ctx.beginPath();
        ctx.arc(cntrX, cntrY, this.radius * 0.2, 0, 2 * Math.PI);
        ctx.fillStyle = BLACK;
        ctx.fill();
        ctx.stroke();
      },
      // 清空棋盘
      clearBoard(){
        const canvas = this.$refs.canvas;      
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

        // 棋盘背景色
        ctx.fillStyle = "#CCFFCC";
        ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        this.currentColor = true;
        this.initBoard(ctx);
      },
      // 初始化并渲染棋盘
      initBoard(ctx){
        this.boardArr = new Array(cellNumber + 1).fill(0).map(() => new Array(cellNumber + 1).fill(0));
        this.killers = [];
        this.root = new Node(null, [], [], 0);
        this.curNode = this.root;
        this.currentColor = true;

        // 绘制横向线条
        for (let row = 1; row <= cellNumber + 1; row++){
          const startX = cellWidth;
          const startY = row * cellWidth;
          const endX = this.lineLength + startX;
          const endY = startY;
          drawLine(ctx, startX, startY, endX, endY);
        }
        
        // 绘制竖向线条
        for (let col = 1; col <= cellNumber + 1; col++){
          const startX = col * cellWidth;
          const startY = cellWidth;
          const endX = startX;
          const endY = this.lineLength + startY;
          drawLine(ctx, startX, startY, endX, endY);        
        }

        // 绘制星位
        for (const xy of stellae) 
          this.drawStellam(ctx, xy[0], xy[1]);      

        // 绘制棋盘坐标
        let font = cellWidth * 0.5;
        ctx.font = font + 'px Arial';
        // 设置棋子颜色
        ctx.fillStyle = BLACK;     
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 1; i <= cellNumber + 1; i++){
          ctx.fillText(i, i * cellWidth, (cellNumber + 2) * cellWidth);   
          ctx.fillText(String.fromCharCode(i + 64), (cellNumber + 2) * cellWidth, i * cellWidth);                 
        }

      },
      test(){
        console.log("子组件test被调用" + "curColor=" + this.currentColor);
        console.log(this.root)
        showBoard(cellNumber, this.boardArr);
        let str = JSON.stringify(convertNodeToJson(this.root));
        console.log(str);
        // this.root.subList = [convertJsonToNode(str)];
        // console.log(this.root)
        // console.log(this.curNode);
        // console.log(this.killers);
        // console.log('this.lastToDie = ' + JSON.stringify(this.lastToDie));
        // console.log(this.currentColor);
      },
      // 上一步or下一步
      jump(steps){
        const canvas = this.$refs.canvas;      
        const ctx = canvas.getContext("2d");

        console.log("jump last");
        console.log(this.curNode);

        console.log("this.stoneBeforeDeduction");
        console.log(this.stoneBeforeDeduction);
        console.log("this.root ->>>" );
        console.log(this.root);
        
        if (steps < 0) {   // 后退        
          for (let i = 0; i < -steps; i++){
            if (this.deduceMode) {            // 研讨模式下的后退
              // 防止后退出研讨模式，以达到只能通过按钮切换模式的目的
              if (this.stoneBeforeDeduction != null && this.curNode.ftr == this.stoneBeforeDeduction) {
                return;
              }
                              
              // 如果curNode是killer，说明需要恢复死子              
              if (this.killers[this.killers.length - 1] == this.curNode) {
                this.killers.pop();
                let startNode = this.stoneBeforeDeduction.subList[0];    // 不清除和重绘stoneBeforeDeduction
                this.redrawStoneFromStartToEnd(ctx, startNode, this.curNode.ftr);   
                if (this.selectedPoint.letter === 'A') {
                  // curNode下没棋子时直接返回，防止curNode本身被后面过分清除
                  this.curNode = this.curNode.ftr;
                  return;
                }            
              } else {
                this.currentColor = !this.currentColor;
              }                          

              let subRoot = this.curNode.ftr;        

              // 将树状分支返回到上一个节点
              this.curNode = subRoot;              
              this.curSteps--;              
              console.log('subRoot');
              console.log(subRoot);          
              
              // 清除当前节点、及其所有子节点图像
              for (const node of subRoot.subList) {         // 数字的棋子
                if (node == this.stoneBeforeDeduction) return;
                let pos = node.pos;
                this.clearStoneByPosition(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth);
                for (const each of node.subList) {          // 字母的棋子
                  let p = each.pos;
                  this.clearStoneByPosition(ctx, (p[1] + 1) * cellWidth, (p[0] + 1) * cellWidth);
                }
              }              
              
              // 重绘分支
              if (subRoot.subList.length > 1) {       // 防止仅有一颗棋子，即没有分支情况下棋子上的手数变成字母
                this.drawBranchesFromSublist(ctx, subRoot);
              }
              if (subRoot.subList.length == 1) this.selectedPoint.letter = 'A';
              else {
                let ascii = 65 + this.curNode.subList.length;
                this.selectedPoint.letter = String.fromCharCode(ascii);
              }            

              if (subRoot.pos.length == 0) this.selectedPoint.showLetter = false;
            } else {  // 非研讨模式下的后退        
              
              // 到底时禁止后退
              if (null == this.curNode.ftr) return;
              console.log("execute-----------===");       
              
              // 如果curNode是killer，说明需要恢复死子              
              if (this.killers[this.killers.length - 1] == this.curNode) {
                this.killers.pop();                
                let startNode = this.root.subList[0];
                this.redrawStoneFromStartToEnd(ctx, startNode, this.curNode.ftr);     
                this.curNode = this.curNode.ftr;           
              } else {                
                // 迭代清除，更新节点
                let pos = this.curNode.pos;
                this.clearStoneByPosition(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth);
                this.currentColor = !this.currentColor;
                this.curNode = this.curNode.ftr;            
              }   

              console.log("非研讨模式----------this.curNode");
              console.log(this.curNode);
              console.log("currentColor" + this.currentColor);
            }
          }       

        } else {        // 前进
          for (let i = 0; i < steps; i++){
            if (this.curNode.subList.length == 0) {
              // 当没有后续时停止前进
              console.log("已经到头了");
              return;
            } else if (this.curNode.subList.length > 1) {
              // 出现分支时，显示分支
              if (this.deduceMode) {
                // 选定某个点之前，前进点击无效
                if (this.branchExist()) return;
                this.drawBranchesFromSublist(ctx, this.curNode);              
                
              } else {
                // 非研讨模式下，绘制选点
                // let selections = this.curNode.subList;
                // for (let i = 0; i < selections.length; i++) {
                //   let pos = selections[i].pos;                
                //   let ch = String.fromCharCode(65 + i);
                //   this.drawSelections(ctx, ch, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth);
                // }
                if (this.branchExist()) return;
                console.log("steps=" + steps);
                this.drawBranchesFromSublist(ctx, this.curNode);
              }
            } else {
              // 叶子节点为字母时，绘制带字母的棋子
              if (this.curNode.subList[0].subList.length == 0 && this.selectedPoint.showLetter) {                
                this.drawBranchesFromSublist(ctx, this.curNode);             
              } else {
                // 叶子节点为数字时，绘制带数字的棋子
                let pos = this.curNode.subList[0].pos;
                this.drawStone(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth, this.radius);
              }
              
            }
            
          }
        }        
        
      },     
      // 根据sublist绘制分支棋子图像
      drawBranchesFromSublist(ctx, curNode){
        // 研讨模式下，直接重绘所有分支
        this.selectedPoint.letter = 'A';                
        for (let i = 0; i < curNode.subList.length; i++) {
          let node = curNode.subList[i];                  
          // 去除掉上一层分支点，以便重新绘制带字母的棋子取代带手数的
          this.clearStoneByPosition(ctx, (node.pos[1] + 1) * cellWidth, (node.pos[0] + 1) * cellWidth);
          // 重绘分支                             
          this.drawStoneInTree(ctx, (node.pos[1] + 1) * cellWidth, (node.pos[0] + 1) * cellWidth, this.radius);
          // 同步更新字母
          let ascii = this.selectedPoint.letter.charCodeAt(0);
          ascii++;
          this.selectedPoint.letter = String.fromCharCode(ascii);                         
        }
      } ,
      // 绘制打谱时的选点
      drawSelections(ctx, ch, x, y){
        // 绘制圆圈
        ctx.beginPath();                
        
        // 绘制棋子上的数字
        let font = cellWidth * 0.6;
        ctx.font = font + 'px Arial';
        // 设置数字颜色
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, x, y);
               
      },
      // 计算某一块棋的总气数
      countTheAeresOfBlockOfStones(curRow, curCol){
        // 队列，BFS找出一整块棋子
        let queue = []; 
        // 成块的棋子
        let block = [];
        // 标记盘面坐标是否已经访问
        let vis = new Array(cellNumber + 1).fill(false).map(() => new Array(cellNumber + 1).fill(false));
        let pos = [curRow, curCol];
        queue.push(pos);
        // 当前棋子颜色
        let curColor = this.boardArr[pos[0]][pos[1]];
        vis[pos[0]][pos[1]] = true;

        while (queue.length > 0){
          let cur = queue.shift();        
          for (const direction of directions) {
            // 找出当前棋子cur周边棋子
            let row = cur[0] + direction[0];
            let col = cur[1] + direction[1];
            // 超出边界、或者访问过时跳过
            if (!isLegal(row, col) || vis[row][col]) continue;
            if (this.boardArr[row][col] == curColor) {
              queue.push([row, col]);
              vis[row][col] = true;
            }
          }
          block.push([cur[0], cur[1]]);
        }

        // 重置vis，用于避免重复计算气数
        vis = new Array(cellNumber + 1).fill(false).map(() => new Array(cellNumber + 1).fill(false));
        // 整块棋的总气数
        let aeres = 0;
        for (const cur of block) {
          for (const direction of directions) {
            // 找出当前棋子cur周边棋子
            let row = cur[0] + direction[0];
            let col = cur[1] + direction[1];
            if (!isLegal(row, col) || vis[row][col]) continue;
            if (this.boardArr[row][col] == 0) {
              vis[row][col] = true;
              aeres++;
            }
          }
        }

        return {
          'aeres': aeres,
          'block': block
        };  
      },
      // 保存棋谱
      save(){
        if (this.root.subList.length === 0) {
          alert("棋盘没有棋子");
          return;
        } 
        let strOfRoot = JSON.stringify(convertNodeToJson(this.root));                 
        this.$emit("infoFromWeiQi", {
          visibility: true,
          str: strOfRoot
        });

      },
      // 读取棋谱
      read(r){
        console.log("=====读取棋谱=====" + cellWidth);
        
        // 由于cellWidth不像成员变量那样独立，所以此时需要恢复到正常大小
        cellWidth = CELL_WIDTH;
        stellae = getStellas(cellWidth);
        this.canvasSize = cellWidth * cellNumber + 2.7 * cellWidth;
        this.lineLength = cellWidth * cellNumber;
        this.radius = cellWidth / 2;
        
        // 重置所有参数，然后根据新获取的root初始化棋盘
        this.draw();

        // 设置subList的同时其ftr也需要设置
        this.root.subList = [r];
        r.ftr = this.root;       

        this.jump(999);        
      },
      // 显示手数(在研讨模式下禁用与此绑定的按钮开关)
      demonstrateSteps(){
        const canvas = this.$refs.canvas;      
        const ctx = canvas.getContext("2d");        
        this.stepsOn = !this.stepsOn;
        let colors = {"1":BLACK, "-1":WHITE};

        if (!this.stepsOn){
          // 重绘没有手数的棋子，即关闭显示手数时
          for (let i = 0; i < this.boardArr.length; i++){
            for (let j = 0; j < this.boardArr[0].length; j++){
              if (this.boardArr[i][j] != 0){
                this.redrawStone(ctx, (j + 1) * cellWidth, (i + 1) * cellWidth, this.radius, colors[this.boardArr[i][j]], 0);
              }
            }
          }
        } else { 
          let nodes = [];
          collect(this.root, this.boardArr);
          for (const node of nodes) {
            let pos = node.pos;
            // console.log(pos);
            this.redrawStone(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth, this.radius, colors[this.boardArr[pos[0]][pos[1]]], node.steps);
          }
          
          // 递归遍历棋谱树，如果棋谱坐标对应的盘面存在棋子，将其存入数组nodes
          // 然后再遍历nodes将逐个显示手数
          function collect(_root, _boardArr){
            let pos = _root.pos;
            if (pos.length && Math.abs(_boardArr[pos[0]][pos[1]]) == 1) nodes.push(_root);
            let list = _root.subList;
            for (const node of list) {
              collect(node, _boardArr);
            }            
          }

        }   
           
      },
      // 根据盘面重绘无手数棋子
      redrawStone(ctx, cntrX, cntrY, radius, stoneColor, steps){
        
        // 绘制圆圈
        ctx.beginPath();
        // 针对白子，半径-0.5使得加上边框后跟黑子一样大
        if (stoneColor == WHITE) radius -= 0.5;  
        ctx.arc(cntrX, cntrY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = stoneColor;
        ctx.fill();
        
        if (stoneColor === WHITE){
          // 给白色棋子添加红色边框
          ctx.lineWidth = 1;
          ctx.strokeStyle = BLACK;
          ctx.stroke();
        }
        
        if (steps){
          // 绘制棋子上的数字
          let font = cellWidth * 0.4;
          ctx.font = font + 'px Arial';
          // 设置数字颜色
          ctx.fillStyle = stoneColor === BLACK ? WHITE : BLACK;     
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(steps.toString(), cntrX, cntrY);         
        }
        

      },
      deduce(){        
        const canvas = this.$refs.canvas;      
        const ctx = canvas.getContext("2d");

        // 进入研讨前定义stoneBeforeDeduction
        if (this.stoneBeforeDeduction == null) this.stoneBeforeDeduction = this.curNode;
        // console.log("this.stoneBeforeDeduction");
        // console.log(this.stoneBeforeDeduction);

        // 预存this.stepsOn
        let stepsOn = this.stepsOn;   
        // 因为this.demonstrateSteps()中对this.stepsOn取反了一次，所以此处设置为true
        this.stepsOn = true;          
        this.deduceMode = !this.deduceMode;
        this.textOfDeduceBtn = this.deduceMode ? "关闭研讨" : "开启研讨";
        // 隐藏研讨模式外落下棋子上的数字
        this.demonstrateSteps();
        
        // this.isDisabled = !this.isDisabled;

        // 还原
        this.stepsOn = stepsOn;  
        
        // 关闭研讨模式时
        if (!this.deduceMode) {
          const canvas = this.$refs.canvas;      
          const ctx = canvas.getContext("2d");   
          
          // 清除研讨模式落下的棋子，但由于被吃掉的子无法恢复，所以不能单纯的清除
          // 转而采用更简单的方式：清除所有棋子后重新绘制所有研讨模式之前的棋子
          // 代码开始>>>>>          
          this.curNode = this.root;
          // this.currentColor = true;
          // this.curSteps = 1;
          // 重绘
          this.redrawStoneFromStartToEnd(ctx, this.curNode, this.stoneBeforeDeduction);
          this.stoneBeforeDeduction.subList = [];
          this.curNode = this.stoneBeforeDeduction;
          // <<<<<代码结束


          // 重置this.curSteps
          // this.curSteps = this.stoneBeforeDeduction.steps;
          // 由于this.demonstrateSteps()会取反this.stepsOn，提前取反保持真实性
          this.stepsOn = !this.stepsOn;            
          // 研讨模式前显示手数，则还原手数；反之则不
          this.demonstrateSteps();  
          // 重置树状分支相关信息
          this.selectedPoint = new SelectedPoint;
          // 推出研讨模式时开启大跳
          // this.greatJumpDisabled = false;
          console.log('this.selectedPoint');
          console.log("this.selectedPoint=" + this.selectedPoint);
          
          // 重置stoneBeforeDeduction
          // this.stoneBeforeDeduction.subList = [];
          this.stoneBeforeDeduction = null;
        }
      },
      // 清除研讨模式落下的棋子，但由于被吃掉的子无法恢复，所以不能单纯的清除
      // 转而采用更简单的方式：清除所有棋子后重新绘制所有研讨模式之前的棋子          
      redrawStoneFromStartToEnd(ctx, startNode, endNode){
        this.curSteps = startNode.steps;
        this.currentColor = this.curSteps % 2 == 0 ? false : true;
        // 清除盘面
        if (null == startNode.ftr){
          // 调节由上面改变的currentColor
          this.currentColor = !this.currentColor;
          // 起点为root时
          for (let i = 0; i < this.boardArr.length; i++) {
            for (let j = 0; j < this.boardArr[0].length; j++){
              if (this.boardArr[i][j]){
                this.clearStoneByPosition(ctx, (j + 1) * cellWidth, (i + 1) * cellWidth);
              }
            }
          }
        } else {
          // 起点非root时      
          let _startNode = startNode;    
          // 最后一颗棋子，即curNode也必须清除。由于此时传参是curNode.ftr，所以需要往下2层
          while (_startNode != endNode.subList[0].subList[0]) { 
            console.log('起点非root时');
            let pos = _startNode.pos;
            _startNode = _startNode.subList[0];
            this.clearStoneByPosition(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth);
          }
        }
        // 为了将endNode也重绘，循环到endNode的下一层
        while (startNode != endNode.subList[0]) {
          let pos = startNode.pos;
          console.log(JSON.stringify(pos));
          startNode = startNode.subList[0];
          if (pos.length == 0) continue;
          let curColor = this.currentColor ? BLACK : WHITE;
          if (this.deduceMode) {
            // 研讨模式
            this.redrawStone(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth, this.radius, curColor, this.curSteps++ - this.stoneBeforeDeduction.steps);
            console.log("完成 " + JSON.stringify(pos));
          } else {
            // 非研讨模式
            this.redrawStone(ctx, (pos[1] + 1) * cellWidth, (pos[0] + 1) * cellWidth, this.radius, curColor, this.curSteps++);
          }
          this.boardArr[pos[0]][pos[1]] = this.currentColor ? 1 : -1;
          this.currentColor = !this.currentColor;
          // 以前的死子必须清除
          if (this.checkAndClear(ctx, pos[0], pos[1])) console.log("清除成功！！！！！");
        } 
      },
      // 根据父组件传来的参数更改当前文件的变量
      funcAndParam(r){
        // 本处是显示预览窗口的棋子
        this.draw();
        // 设置subList的同时其ftr也需要设置
        this.root.subList = [r];
        r.ftr = this.root;        
        
        this.jump(1000)
      },      
      // 判断盘面上是否存在分支点
      branchExist(){
        for (let i = 0; i < this.boardArr.length; i++) {
          for (let j = 0; j < this.boardArr[0].length; j++) {
            if (2 == this.boardArr[i][j]) return true;
          }
        }
        return false;
      }
    },
    
  };

  // 判断某个盘面坐标是否合法
  function isLegal(row, col) {
    return row >= 0 && row <= cellNumber && col >= 0 && col <= cellNumber;
  }  

    
  
</script>


<style>
  /* 字母样式 */
  .follow-letter {
    position: fixed;
    font-size: 24px;
    color: black;
    pointer-events: none; /* 确保字母不影响鼠标事件 */
    
  }
</style>