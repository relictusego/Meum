<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="login">
      <label for="username">Username:</label>
      <input type="text" v-model="username" id="username" required>
      <label for="password">Password:</label>
      <input type="password" v-model="password" id="password" required>
      <button type="submit">Login</button>
    </form>
    <button @click="show">show</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: ''
    };
  },
  methods: {
    show(){
      this.$axios.get("/user/show").then(res =>{
        console.log(res.data);
      })
    },
    login() {
      this.$axios.post('/user/login', {"username": this.username, "password": this.password}).then(res =>{
        let status = res.data.status;
        if (status === "SUCCESS"){
          this.$router.replace('/weiqi')          
        }
        else console.log(res.data);
      })  
    }
  }
};
</script>

<style scoped>
.login-container {
  max-width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
form {
  display: flex;
  flex-direction: column;
}
label {
  margin-top: 10px;
}
input {
  padding: 5px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
}
button {
  padding: 5px 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
</style>
