<!-- 围棋应用主界面 -->
<template>
  <div>
    <div style="position: relative; top: 250px; left: 35%;">
      <PopOfSaving 
       :visible="popOfSavingVisible" 
       @infoFromPopSaving="getInfoFromPopSaving"       
       ></PopOfSaving>
      <ReadPreview       
       v-if="show"
       @infoFromReadPreview="getInfoFromReadPreview"
      ></ReadPreview>
    </div>

    <WeiQi @infoFromWeiQi="getInfoFromWeQi"></WeiQi>

    <div>
      <button @click="jump(-10)">&lt;&lt;</button><button @click="jump(-1)">&lt;</button>
      <button @click="jump(1)">></button><button @click="jump(10)">>></button>
      <button @click="clearBoard" :disabled="isDisabled">清空棋盘</button>
      <button @click="save">保存棋谱</button>
      <button @click="read" :disabled="isDisabled">读取棋谱</button>
      <button @click="demonstrateSteps" :disabled="isDisabled"> {{ textOfStepsBtn }} </button>
      <button @click="deduce">{{ textOfDeduceBtn }}</button>
      <button @click="test">test</button>
    </div>
  </div>
</template>

<script>
  import WeiQi from './WeiQi.vue';
  import PopOfSaving from './PopOfSaving.vue';
  import ReadPreview from './ReadPreview.vue';

  let textOfSteps = ["显示手数", "隐藏手数"];
  let textOfDeduce = ["开启研讨", "关闭研讨"];
  let flagOfSteps = 1;
  let flagOfDeduce = 0;

  export default {
    data() {
        return {
          popOfSavingVisible: false,
          show: false,
          // readPreviewVisible: false,
          isDisabled: false,                    // “显示手数”按钮是否禁用
          textOfStepsBtn: "隐藏手数",           // “显示手数”按钮文本
          textOfDeduceBtn: "开启研讨",          // “开启研讨”按钮文本
          
          strOfRoot: "",                       // 根节点的字符串形式
        };
    },
    methods: {
      getInfoFromWeQi(info){
        console.log("info======" + JSON.stringify(info));
        this.popOfSavingVisible = info.visibility;
        this.strOfRoot = info.str;
      },
      // 获取弹窗中输入的棋谱名，并将WeiQi传来的棋谱一起封装，发送请求
      getInfoFromPopSaving(info){
        this.popOfSavingVisible = info.visibility;
        this.manualName = info.content;
        console.log(info.visibility + " | " + info.content);
        // 选择取消时不发送请求
        if (!info.hasContent) return;

        console.log(this.strOfRoot);
        this.$axios.post('/weiqi/save', {
          manualName: this.manualName,
          manualContent: this.strOfRoot
        }).then(response => {
          console.log(response.data);
        });
      },
      // 获取ReadPreview组件传来的值
      getInfoFromReadPreview(info){        
        console.log("info=====>");
        if (info.show !== undefined) {
          this.show = info.show;
          console.log(this.show);
        }
        if (info.root !== undefined) {
          console.log(info.root);
          this.$emit('weiqi-event', 'read', info.root); 
        }
      },
      jump(steps){
        this.$emit('weiqi-event', 'jump', steps); 
      },
      save(){
        this.$emit('weiqi-event', 'save'); 
      },
      clearBoard(){
        this.$emit('weiqi-event', 'clearBoard');  
      },
      read(){
        console.log("this.show=" + this.show);
        this.show = true; 
        console.log("this.show=" + this.show);
      },
      demonstrateSteps(){
        flagOfSteps = 1 ^ flagOfSteps;
        this.textOfStepsBtn = textOfSteps[flagOfSteps];
        this.$emit('weiqi-event', 'demonstrateSteps');   
      },
      deduce(){
        this.isDisabled = !this.isDisabled;
        flagOfDeduce = 1 ^ flagOfDeduce;
        this.textOfDeduceBtn = textOfDeduce[flagOfDeduce];
        this.$emit('weiqi-event', 'deduce');     
      },
      test(){
        console.log("父组件test调用");
        this.$emit('weiqi-event', 'test');        
      }
    },
    components: { 
      WeiQi,
      PopOfSaving,
      ReadPreview
    }
};
</script>

<style>

</style>