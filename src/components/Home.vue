<template>
  <div>
    <h1>首页</h1>
    <router-link to="/weiqi">围棋</router-link>
    <router-link to="/login">登录</router-link>
    <router-view/>
    <div>
      <button @click="toggle">Blog</button>
      <button @click="test">测试</button>
      <Blog v-if="show"></Blog>

    </div>
  </div>
</template>

<script>
  import Blog from './Blog.vue'

  export default {
    components:{
      Blog
    },
    data(){
      return{
          show: false,
      }
    },
    methods:{
      toggle(){
        this.show = !this.show;
      },
      test(){

        console.log("testtest");
        this.$emit("blog-event", "test", 2);
        console.log("testtest");
      },
    }
  };
</script>

<style>

</style>