import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'
import Home from '@/components/Home'
import Blog from '@/components/Blog'
import Main from '@/components/weiqi/Main'


Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/blog',
      name: 'Blog',
      component: Blog
    },
    {
      path: '/weiqi',
      name: 'Main',
      component: Main
    },
  ],
  mode: 'history'
})


//前置钩子
router.beforeEach((to,from,next)=>{
  console.log("路由前");
  //判断是否有token
  let token = localStorage.getItem("token");
  console.log("token: " + token)
  //如果是访问登录页和注册页，直接放行
  if(to.path=='/'|| to.path=='/login'||to.path=='/regist'){
    next();
    return;
  }
   if(token){
    console.log("判断token成功")
     //有放行
     next();
   }else{
     //没有
     alert("你还没登录!");
     //去登录页面
     next("/login");
   } 
  
})

export default router;

//获取原型对象上的push函数
const originalPush = Router.prototype.push;
//修改原型对象中的push方法
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(Router)