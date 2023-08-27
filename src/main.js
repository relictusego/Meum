// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI);
Vue.config.productionTip = false
Vue.prototype.$axios = axios
// axios.defaults.baseURL = "http://localhost:9000/"
axios.defaults.baseURL = "api/"

//配置拦截器
//请求拦截器：发出请求前执行特殊代码，如：将token写入请求头
axios.interceptors.request.use(config => {
  //设置token
  console.log("请求拦截器执行拦截.....");
  let token = window.localStorage.getItem('token');
  
  if (token){ //若是token存在
    config.headers.authorization = token;
  }
  
  //返回配置对象
  return config;
}); 

axios.interceptors.response.use(
  response => {
    console.log("响应拦截器执行拦截.....");
    // 从响应头中获取token
    let token = response.headers.authorization;
    console.log("token= " + token);
    if (token) {
       //将当前登录人的token存放起来
      window.localStorage.setItem("token",token);
      console.log("返回的数据:"+response.data);
      //将当前登录人的角色存放起来
      // window.localStorage.setItem("role",response.data.data[0].name);
    }
    return response;
  }
);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
