<template>
  <div>
    <el-dialog title="棋谱一览" :visible.sync="dialogVisible" @close="closeDialog">
      <el-table :data="gridData">
        <el-table-column property="manualDate" label="日期"></el-table-column>
        <el-table-column label="棋谱" >
          <template slot-scope="scope">
            <span @mouseover="handleRowMouseover(scope.row)"                
                  @mouseleave="handleRowMouseLeave" 
                  @mousemove="updatePreviewPosition"
                  @dblclick="selectManual(scope.row)"
                  >
              {{scope.row.manualName}}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div style="height: 20px;"></div>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 15, 20]"
        :page-size="size"
        layout=" prev, pager, next, jumper,total, sizes"
        :total="total">
      </el-pagination>
    </el-dialog>

    <!-- 跟随光标的Canvas图像 -->
    <div v-show="showPreviewer" ref="previewCanvasContainer" class="canvas-container" :style="{ top: posY + 'px', left: posX + 'px' }">
      <WeiQi :pData="data"></WeiQi>
    </div>
  </div>
</template>

<script>
  import WeiQi from './WeiQi.vue';  

  // 导入函数
  import {
    convertJsonToNode,
  } from "../script/baduk"

  export default {
    data(){
      return{
        gridData: [],      
        currentPage:1,
        size:5,
        total:0,        
        // dialogTableVisible: false,   
        // canvas预览棋盘的信息
        showPreviewer: false,
        posX: 0,
        posY: 0,
        dialogVisible: false,

        data: [],

      }
    },
    methods:{    

      hidePreview() {
        // 鼠标移开时隐藏Canvas图像
        this.showPreviewer = false;
      },
      updatePreviewPosition(event) {
        // 更新Canvas图像的位置为鼠标的右边一点点
        this.posX = event.clientX + 20; // 20是一个偏移量，可以根据实际需要调整
        this.posY = event.clientY;
      },
      closeDialog(){
        this.dialogVisible = false;
        this.$emit('infoFromReadPreview', {
          show: false
        }); // 发出自定义事件来更新父组件数据
      },
      handleRowMouseover(row) {
        console.log('Mouseover on row:');
        let manual = convertJsonToNode(row.manualContent);
        console.log(manual);
        // 当鼠标悬停在某条内容上时，设置预览内容并显示Canvas图像
        this.showPreviewer = true;
        // 使用$nextTick确保DOM元素已经渲染
        this.$nextTick(() => {
          this.sendEvent("funcAndParam", manual);
        });
      },
      handleRowMouseLeave(){
        this.showPreviewer = false;
      },
      //当前页大小修改时
      handleSizeChange(val){
        this.size = val
        this.sendReadRequest("/weiqi/read/" + this.currentPage + "/" + this.size);
      },
      //当前页码修改时
      handleCurrentChange(val){
        this.currentPage = val        
        this.sendReadRequest("/weiqi/read/" + this.currentPage + "/" + this.size);
      },
      sendReadRequest(url){
        this.$axios.get(url).then(res =>{
          this.gridData = res.data.data.data;
          this.total = res.data.data.total;
          console.log(this.total);
          console.log(res.data.data.data);
        })
      },
      handleCustomEvent(message) {
        console.log('父组件发送的消息在子组件中接收到：', message);
        // 在这里处理收到的消息
      },
      test(){
        this.$emit("weiqi-event", "test");
      },
      sendEvent(func, param){
        console.log("-----发送事件----");
        // 每次调用时清空一次，避免累积
        this.data = [];
        this.data.push(func);
        this.data.push(param);
        console.log("-----发送事件完成----");
      },
      selectManual(row){
        console.log('selected row:');
        let manual = convertJsonToNode(row.manualContent);
        console.log(manual);
        this.dialogVisible = false;
        this.$emit("infoFromReadPreview",{
          show: false,
          root: manual
        });
      }
    },
    mounted() {
      this.dialogVisible = true;
      this.sendReadRequest("/weiqi/read/" + this.currentPage + "/" + this.size);
      this.$nextTick(()=>{

      });
    },
    components:{
      WeiQi,
      
    },

  };
</script>

<style>
  .canvas-container {
    position: fixed;
    pointer-events: none; /* 确保Canvas图像不影响鼠标事件 */
    z-index: 2500;
  }
</style>