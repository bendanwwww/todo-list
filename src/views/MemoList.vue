<template>
  <div class="root" @click="cancel">
    <draggable
      class="list"
      v-model="memoList"
      v-bind="dragOptions"
      @start="drag = true"
      @end="drag = false"
      :disabled="clickIndex !== -1"
    >
      <transition-group type="transition" :name="!drag ? 'flip-list' : null">
        <div
          class="item"
          v-for="(memo, index) in memoList"
          :key="'memo' + index"
          @click.stop="click(index)"
        >
          <p v-if="clickIndex !== index">{{ index + 1 }}.{{ memo.content }}</p>
          <div class="edit" v-else>
            <input
              v-model="memo.content"
              v-focus
              @click.stop="return false;"
              @keyup.27="cancel"
              spellcheck="false"
              readOnly="true"
            />
            <i class="iconfont icon-edit" @click.stop="openMemoWindows(memo.id)"></i>
            <i class="iconfont icon-ashbin" @click.stop="remove(memo.id)"></i>
          </div>
        </div>
      </transition-group>
    </draggable>
  </div>
</template>
<script>
import draggable from "vuedraggable";
import { ipcRenderer } from "electron";
import DB from "@/utils/db";

export default {
  name: "MemoList",
  components: {
    draggable,
  },
  data() {
    return {
      pageName: 'memoList',
      memoList: null,
      drag: false,
      clickIndex: -1
    };
  },
  methods: {
    // 兼容性赋值
    addMethods(list) {
      return list;
    },
    getMemoList() {
      const list = DB.get("memoList");
      this.memoList = this.addMethods(list);
      var split_index = 24;
      for(var i = 0 ; i < this.memoList.length ; i++) {
        if (this.memoList[i].content.length > split_index) {
          this.memoList[i].content = this.memoList[i].content.substring(0, split_index) + '...';
        }
      }
    },
    click(index) {
      this.clickIndex = index;
    },
    cancel() {
      this.clickIndex = -1;
    },
    remove(id) {
      ipcRenderer.invoke("checkMemoWindows", id).then((result) => {
        if(result) {
          DB.removeById("memoList", id);
          this.getMemoList();
        }
      });
    },
    refush() {
      setInterval(() => {
        ipcRenderer.invoke("hasMemoWindows").then((result) => {
          if(result) {
            this.getMemoList();
          }
        });
      }, 1000);
    },
    openMemoWindows(id) {
      ipcRenderer.invoke("checkMemoWindows", id).then((result) => {
        if(result) {
          ipcRenderer.invoke("openMemoWindows", id);
        }
      });
    }
  },
  computed: {
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost",
      };
    },
  },
  created() {
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath);
      this.getMemoList();
      this.refush();
    });
  },
  directives: {
    focus: {
      inserted: function(el) {
        el.focus();
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.root {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 0 15px 28px 15px;
  .list {
    .item {
      height: 28px;
      p {
        width: 100%;
        height: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        line-height: 28px;
      }
      .edit {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        input {
          flex: 1;
          height: 100%;
          outline: none;
          border: none;
          background: transparent;
          font-size: 16px;
          line-height: 28px;
        }
        i {
          line-height: 28px;
          padding: 0 5px;
          cursor: pointer;
        }
      }
    }
    .item:hover {
      p {
        color: rgba($color: #ffffff, $alpha: 0.6);
      }
    }
  }
}

.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
}
</style>
