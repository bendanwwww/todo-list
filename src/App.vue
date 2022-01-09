<template>
    <div v-if="showState" id="app" :class="{ unfocused: ignoreMouse }">
      <div class="background">    
        <img :src="backgroundImg" width="100%" height="100%" alt="" />
      </div>
      <div class="mask"></div>
      <div class="drag-nav">
        <b>{{ appName }}</b>
        <i>Powered by xhznl & lsy</i>
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
    <div v-else class="shrink" @click="changeWindows">
      <!-- <i
        :class="['iconfont', showState ? 'icon-run-in' : 'icon-run-up']"
        key="test2"
        @click="changeWindows"
      ></i> -->
    </div>
</template>

<script>
import pkg from "../package.json";

import DB from "@/utils/db";
import { ipcRenderer } from "electron";

export default {
  data() {
    return {
      pageName: 'main',
      appName: pkg.name,
      ignoreMouse: false,
      backgroundImg: '',
      showState: false
    };
  },
  methods: {
    changeWindows() {
      if (this.showState) {
        ipcRenderer.invoke("shrinkWindows").then(() => {
          this.showState = false;
        });
      } else {
        ipcRenderer.invoke("showWindows").then(() => {
          this.showState = true;
        });
      }
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
    }
  },
  created() {
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath);
      this.backgroundImg = DB.get("settings.background_img");
    });
    ipcRenderer.on('refresh', (event, name, msg) => {
      console.info("name: " + name + " msg: "+ msg);
      if (name == this.pageName) {
        this.refresh();
      }
    });
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
      width: 100%;
      height: 100%;
      border: 0px solid red;
      background-size:100%;
      // border-radius: 50%;
      // background-color: red;
      background-image: url("./assets/bar.png");
  }
</style>
