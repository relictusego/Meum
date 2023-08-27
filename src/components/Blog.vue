<template>
  <div>
    <h1>博客</h1>
    <router-link to="/">首页</router-link>
    <router-view/>
    <input type="text" @keydown="handleKeyDown" v-model="content">
  </div>
</template>

<script>

  export default {
    data(){
      return{
          content: ""
      }
    },    
    mounted() {
      this.$parent.$on('blog-event', this.handleCustomEvent);
      window.addEventListener('keydown', this.handleKeyDown);
    },
    beforeUnmount() {
      this.$parent.$off('blog-event', this.handleCustomEvent);
    },
    methods:{
      test(v){
        alert("v=" + v)
      },
      handleCustomEvent(functionName, param) {
        console.log('接收到：', functionName + " : " + JSON.stringify(param));
        // 在这里处理收到的消息
        if (typeof this[functionName] === 'function') {
          console.log("确定是函数");
          this[functionName](param);
        } else {
          console.log('未找到对应的方法');
        }
      },
      handleKeyDown(event) {
        this.keyDown = event.key;
        if (event.key === "Enter")
        {
          alert(this.content)
        }

      },
      
    },
    watch:{
        pData(n, o){
          this.$nextTick(() => {
            console.log(o + " -> " + n);
            this.handleCustomEvent(this.pData[0], this.pData[1]);
          });
        }
      },
      props: {
        pData:[],
      }
  };
</script>

<style>

</style>