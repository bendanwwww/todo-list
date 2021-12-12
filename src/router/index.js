import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Todo",
    component: () => import("../views/Todo.vue"),
  },
  {
    path: "/longTodo",
    name: "LongTodo",
    component: () => import("../views/LongTodo.vue"),
  },
  {
    path: "/done",
    name: "Done",
    component: () => import("../views/Done.vue"),
  },
  {
    path: "/memoList",
    name: "MemoList",
    component: () => import("../views/MemoList.vue"),
  },
  {
    path: "/memo",
    name: "Memo",
    component: () => import("../views/Memo.vue"),
  }
];

const router = new VueRouter({
  routes,
});

export default router;
