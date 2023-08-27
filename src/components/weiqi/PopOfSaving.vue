<template>
  <div>
    <el-popover
      placement="top"
      width="300"
      offset="50"
      v-model="visible"
      @click="toggleVisibility">
      <el-input v-model="inputContent" placeholder="棋谱名(可选)"></el-input>
      <div style="text-align: right; margin: 0">
        <el-button size="mini" type="text" @click="toggleVisibility">取消</el-button>
        <el-button type="primary" size="mini" @click="sendMessage">确定</el-button>
      </div>
    </el-popover>
  </div>
</template>

<script>

  export default {
    data(){
      return{
        inputContent: ''
      }
    },
    methods:{
      toggleVisibility(){
        this.$emit('infoFromPopSaving', {
          visibility: false,
          hasContent: false,          
        });                
      },
      sendMessage(){
        this.$emit('infoFromPopSaving', {
          visibility: false,
          hasContent: true, 
          content: this.inputContent
        });  
      }
    },
    props: {
      visible: ''
    }
  };
</script>

<style>

</style>