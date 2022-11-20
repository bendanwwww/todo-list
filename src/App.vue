<template>
    <div v-if="showState || this.$route.path == '/memo'" id="app" :class="{ unfocused: ignoreMouse }">
      <div class="background">    
        <img :src="backgroundImg" width="100%" height="100%" alt="" />
      </div>
      <div class="mask"></div>
      <div class="drag-nav">
        <b>{{ appName }}</b>
        <i>{{ weather }}</i>
      </div>
      <div v-if="this.$route.path !== '/memo'" class="nav">
        <div class="link">
          <router-link draggable="false" to="/">Todo</router-link> |
          <router-link draggable="false" to="/longTodo">Schedule</router-link> |
          <router-link draggable="false" to="/done">Done</router-link> |
          <router-link draggable="false" to="/memoList">Memo</router-link>
        </div>
        <div class="tools">
          <transition-group name="fade" mode="out-in">
            <!-- <i class="iconfont icon-run-up" key="test1" @click="showWindows"></i>
            <i class="iconfont icon-run-in" key="test2" @click="shrinkWindows"></i> -->

            <i class="iconfont icon-arrow-double-right" key="shrink" @click="changeWindows"></i>
            <i v-if="this.$route.path === '/memoList'" class="iconfont icon-add" key="open" @click="openMemoWindows"></i>
            <i class="iconfont icon-export" key="export" @click="exportData"></i>
            <i class="iconfont icon-eye-close" key="hide" @click="hideWindow"></i>
            <i
              :class="['iconfont', ignoreMouse ? 'icon-lock' : 'icon-unlock']"
              key="lock"
              @mouseenter="setIgnoreMouseEvents(false)"
              @mouseleave="setIgnoreMouseEvents(ignoreMouse)"
              @click="ignoreMouse = !ignoreMouse"
            ></i>
          </transition-group>
        </div>
      </div>
      <div class="nav" v-else>
        <div class="link">
          <b tag="i" draggable="false">Memo</b>
        </div>
        <div class="tools">
          <transition-group name="fade" mode="out-in">
            <i class="iconfont icon-close" key="close" @click="closeMemo"></i>
            <i
              :class="['iconfont', ignoreMouse ? 'icon-lock' : 'icon-unlock']"
              key="lock"
              @mouseenter="setMemoIgnoreMouseEvents(false)"
              @mouseleave="setMemoIgnoreMouseEvents(ignoreMouse)"
              @click="ignoreMouse = !ignoreMouse"
            ></i>
          </transition-group>
        </div>
      </div>
      <div class="main scrollbar scrollbar-y">
        <transition name="fade-transform" mode="out-in">
          <!-- <keep-alive> -->
          <router-view />
          <!-- </keep-alive> -->
        </transition>
      </div>
    </div>
    <!-- <div v-else class="shrink" @mousedown="handleDragStart" @mouseup="handleDragEnd"> <div v-else id="shrink" class="shrink"  -->
    <div v-else id="shrink" class="shrink" :style="{backgroundImage: 'url(' + icon + ')'}"
    @click="changeWindows" @mousedown="handleDragStart" @mouseup="handleDragEnd" @mouseover="handleMouseOver" @mouseout="handleMouseOut">
      <!-- <div class="shrink-child" @click="changeWindows"></div> -->
    </div>
</template>

<script>
// import pkg from "../package.json";

import DB from "@/utils/db";
import { ipcRenderer } from "electron";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

export default {
  data() {
    return {
      pageName: 'main',
      appName: 'todo-list',
      ignoreMouse: false,
      backgroundImg: '',
      showState: false,
      clickState: false,
      dragMove: false,
      upAndDoenTime: 0,
      weather: '',
      icon: 'http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/bar.png',
      // icon: require('./assets/bar.png'),
      stillIcon: null,
      runGifImg: null,
      returnGifImg: null,
      mouseDownGifImg: null,
      mouseUpGifImg: null
    };
  },
  methods: {
    changeWindows() {
      console.info("changeWindows " + this.dragMove);
      if (this.dragMove) {
        return;
      }
      if (this.showState) {
        ipcRenderer.invoke("hideWindow");
        ipcRenderer.invoke("shrinkWindows").then(() => {
          this.showState = false;
          this.clickState = false;
          this.getStillIcon();
          ipcRenderer.invoke("showWindow");
        });
      } else {
        this.getMouseUpIcon();
        setTimeout(() => {
          ipcRenderer.invoke("hideWindow");
          ipcRenderer.invoke("magnifyWindows").then(() => {
            this.showState = true;
            this.clickState = false;
            ipcRenderer.invoke("showWindow");
          });
        }, 600);
      }
    },
    handleMouseOver() {
      if (!this.clickState) {
        this.getMouseOverIcon();
      }
    },
    handleMouseOut() {
      if (!this.clickState) {
        this.getMouseOutIcon();
      }
    },
    handleDragMove() {
      ipcRenderer.invoke("handleDragMove");
    },
    handleDragStart() {
      this.upAndDoenTime = new Date().getTime();
      this.dragMove = true;
      this.clickState = true;
      this.getMouseDownIcon();
      console.info("handleDragStart " + this.upAndDoenTime);
      ipcRenderer.invoke("handleDragStart");
    },
    handleDragEnd() {
      const nowTime = new Date().getTime();
      console.info("handleDragEnd " + nowTime + " " + this.upAndDoenTime);
      if (nowTime - this.upAndDoenTime < 500) {
        this.dragMove = false;
      } else {
        this.getStillIcon()
      }
      ipcRenderer.invoke("handleDragEnd");
    },
    setIgnoreMouseEvents(ignore) {
      ipcRenderer.invoke("setIgnoreMouseEvents", ignore);
    },
    setMemoIgnoreMouseEvents(ignore) {
      ipcRenderer.invoke("setMemoIgnoreMouseEvents", this.$route.query.timestamp, ignore);
    },
    openMemoWindows() {
      ipcRenderer.invoke("openMemoWindows", '');
    },
    exportData() {
      ipcRenderer.invoke("exportData");
    },
    hideWindow() {
      ipcRenderer.invoke("hideWindow");
    },
    closeMemo() {
      if (this.$route.path === '/memo') {
        ipcRenderer.invoke("removeMemoWindows", this.$route.query.id, this.$route.query.timestamp).then(() => {
          window.close();
        });
      }
    },
    refresh() {
      this.backgroundImg = DB.get("settings.background_img");
    },
    getIp() {
      axios.get('https://api.ipify.org/?format=json')
        .then(response => (this.getWeatherByIp(response.data.ip)))
        .catch(function (error) {
          console.log(error);
        });
    },
    getWeatherByIp(ip) {
      let networkInfo = require('os').networkInterfaces();
      networkInfo['ip'] = ip;
      axios.post('http://veni-vidi-vici.cn/commonTool/weather', networkInfo)
        // .then(response => (this.weather = response.data.city + ', ' + response.data.weather + ', ' + response.data.temperature + "℃, 湿度 " + response.data.humidity + ', ' + response.data.winddirection + '风 ' + response.data.windpower + " 级" + response.data.exp))
        .then(response => (this.weather = response.data.exp))
        .catch(function (error) {
          console.log(error);
        });
    },
    getStillIcon() {
      this.icon = this.stillIcon.src;
    },
    getMouseDownIcon() {
      this.icon = this.mouseDownGifImg.src;
      this.reloadMouseUpGif();
      this.reloadStillPng();
      this.reloadRunGif();
      this.reloadReturnGif();
    },
    getMouseUpIcon() {
      this.icon = this.mouseUpGifImg.src;
      this.reloadMouseDownGif();
      this.reloadStillPng();
      this.reloadRunGif();
      this.reloadReturnGif();
    },
    getMouseOverIcon() {
      this.icon = this.runGifImg.src;
      this.reloadReturnGif();
      this.reloadStillPng();
      this.reloadMouseUpGif();
      this.reloadMouseDownGif();
    },
    getMouseOutIcon() {
      this.icon = this.returnGifImg.src;
      this.reloadRunGif();
      this.reloadStillPng();
      this.reloadMouseUpGif();
      this.reloadMouseDownGif();
    },
    reloadStillPng() {
      this.stillIcon = new Image()
      this.stillIcon.src = "http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/bar.png?time=" + new Date().getTime();
    },
    reloadRunGif() {
      this.runGifImg = new Image()
      this.runGifImg.src = "http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/bar.gif?time=" + new Date().getTime();
    },
    reloadReturnGif() {
      this.returnGifImg = new Image()
      this.returnGifImg.src = "http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/bar_return.gif?time=" + new Date().getTime();
    },
    reloadMouseDownGif() {
      this.mouseDownGifImg = new Image()
      this.mouseDownGifImg.src = "http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/mouse_down.png?time=" + new Date().getTime();
    },
    reloadMouseUpGif() {
      this.mouseUpGifImg = new Image()
      this.mouseUpGifImg.src = "http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/click.gif?time=" + new Date().getTime();
    }
  },
  created() {
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath);
      this.backgroundImg = DB.get("settings.background_img");
      if (DB.get("app_id") == "") {
        DB.set("app_id", uuidv4());
      }
    });
    ipcRenderer.on('refresh', (event, name, msg) => {
      console.info("name: " + name + " msg: "+ msg);
      if (name == this.pageName) {
        this.refresh();
      }
    });
    this.getIp();
    this.reloadStillPng();
    this.reloadRunGif();
    this.reloadReturnGif();
    this.reloadMouseDownGif();
    this.reloadMouseUpGif();
    setInterval(this.getIp, 1000 * 30);
    // setInterval(this.getIcon, 1000 * 10);
  },
};
</script>

<style lang="scss" scoped>
.background {
    width:100%;
    height:100%;  /**宽高100%是为了图片铺满屏幕 **/
    z-index:-1;
    position: absolute;
    opacity: 0.5;
}
#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: rgba($color: #000000, $alpha: 0.6);
  border-radius: 5px;
  .mask {
    display: none;
    position: absolute;
    z-index: 999;
    width: 100%;
    height: 100%;
  }
  .drag-nav {
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 20px;
    padding: 0 20px;
    box-sizing: border-box;
    font-size: 12px;
    b,
    i {
      color: rgba($color: #ffffff, $alpha: 0.3);
    }
  }
  .nav {
    display: flex;
    justify-content: space-between;
    height: 26px;
    padding: 0 20px;
    color: #cccccc;
    user-select: none;
    .link {
      a {
        font-weight: bold;
        color: #cccccc;
        text-decoration: none;
        &.router-link-exact-active {
          font-size: 20px;
          color: #ffffff;
        }
        &:hover {
          color: rgba($color: #ffffff, $alpha: 0.6);
        }
      }
      b {
        font-weight: bold;
        color: #cccccc;
        text-decoration: none;
        font-size: 20px;
        color: #ffffff;
      }
    }
    .tools {
      display: flex;
      i {
        font-size: 20px;
        line-height: 26px;
        padding: 0 5px;
        cursor: pointer;
      }
    }
  }
  .main {
    flex: 1;
    margin: 10px 0;
    overflow-y: auto;
    &:hover::-webkit-scrollbar-thumb {
      display: block;
    }
  }
}
#app.unfocused {
  opacity: 0.8;
  .mask {
    display: block;
  }
  .tools {
    z-index: 1000;
  }
}
.shrink {
      // -webkit-app-region: drag;
      width: 100%;
      height: 100%;
      border: 0px solid red;
      background-size:100% 100%;
      // border-radius: 50%;
      // background-color: red;
      // background-image: url("./assets/bar.gif");
  }
  .shrink-child {
      -webkit-app-region: no-drag;
      width: 100%;
      height: 100%;
      border: 0px solid red;
      background-size:100% 100%;
      // border-radius: 50%;
      // background-color: red;
      // background-image: url("./assets/bar.png");
  }
</style>