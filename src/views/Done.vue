<template>
  <div class="root">
    <div class="list" v-for="(value, key) in doneGroupList" :key="key">
      <div class="group">{{ getDateStr(key) }}</div>
      <div v-for="(done, index) in value" :key="done.id">
        <div class="item"
        @click.stop="editId === done.id ? (editId = '') : (editId = done.id)"
        @mouseenter="moveItem(index)"
        @mouseleave="leaveItem(index)">
          <p>{{done.important == 1 ? '★' : ''}} {{ index + 1 }}.{{ done.content }}</p>
          <i v-if="index == moveIndex && done.todo_item_list !== undefined && done.todo_item_list !== null && done.todo_item_list.length > 0" 
              :class="['iconfont', inDropList(key, index) ? 'icon-arrow-up-bold' : 'icon-arrow-down-bold']"
              @click.stop="dropItem(key, index)"
          ></i>
          <i
            v-if="editId === done.id"
            class="iconfont icon-back"
            @click.stop="restore(done, key, index)"
          ></i>
          <i
            v-if="editId === done.id"
            class="iconfont icon-close"
            @click.stop="remove(done, key, index)"
          ></i>
        </div>
        <div v-if="inDropList(key, index)">
          <div v-for="(item, item_index) in done.todo_item_list" :key="'todo_item' + item_index">
            <div class="item-next">
              <div class="edit">
                <p>({{ item_index + 1 }}) {{item.content}}  {{item.important == 1 ? '【已完成】' : ''}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import DB from "@/utils/db";
import { getDateStr } from "@/utils/common";

export default {
  name: "Done",
  data() {
    return {
      pageName: 'done',
      doneGroupList: null,
      editId: "",
      dropDownList: [],
      moveIndex: "",
    };
  },
  methods: {
    getDateStr,
    getDoneList() {
      const list = DB.groupby("doneList", "done_date");
      this.doneGroupList = list;
    },
    restore(done, key, index) {
      var dataName = "todoList"
      if (done.type == 'long') {
        dataName = "longTodoList"
      }
      DB.insert(dataName, {
        todo_date: done.todo_date,
        todo_datetime: done.todo_datetime,
        content: done.content,
        type: done.type,
        important: done.important,
        todo_item_list: done.todo_item_list
      });
      DB.removeById("doneList", done.id);
      this.getDoneList();
      this.refashDropList(key, index);
    },
    remove(done, key, index) {
      DB.removeById("doneList", done.id);
      this.getDoneList();
      this.refashDropList(key, index);
    },
    moveItem(index) {
      this.moveIndex = index;
    },
    leaveItem(index) {
      if (this.moveIndex == index) {
        this.moveIndex = -1;
      }
    },
    inDropList(key, index) {
      return this.dropDownList.indexOf(this.buildDropKey(key, index)) > -1;
    },
    dropItem(key, index) {
      if (this.moveIndex == index) {
        let dropIndex = this.dropDownList.indexOf(this.buildDropKey(key, index))
        if (dropIndex > -1) {
          this.dropDownList.splice(dropIndex, 1);
        } else {
          this.dropDownList.push(this.buildDropKey(key, index));
        }
      }
    },
    refashDropList(key, index) {
      let dropIndex = this.dropDownList.indexOf(this.buildDropKey(key, index))
      if (dropIndex > -1) {
        this.dropDownList.splice(dropIndex, 1);
      }
      for (var i = 0 ; i < this.dropDownList.length ; i++) {
        let dropValue = this.dropDownList[i].split("_")
        let dropIndex = parseInt(dropValue[1])
        if (dropIndex > index) {
          this.dropDownList[i] = this.buildDropKey(key, dropIndex - 1);
        }
      }
      let removeIndex = this.dropDownList.indexOf(this.buildDropKey(key, -1))
      if (removeIndex > -1) {
        this.dropDownList.splice(removeIndex, 1);
      }
    },
    buildDropKey(key, index) {
      return key + "_" + index;
    },
  },
  created() {
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath);
      this.getDoneList();
    });
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
    .group {
      position: sticky;
      top: 0;
      z-index: -999;
      height: 224px;
      line-height: 180px;
      box-sizing: border-box;
      color: rgba($color: #ffffff, $alpha: 1.0);
      font-size: 35px;
      text-align: center;
      user-select: none;
    }
    .item {
      display: flex;
      height: 28px;
      p {
        width: 100%;
        height: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        line-height: 28px;
        cursor: pointer;
      }
      i {
        line-height: 28px;
        padding: 0 5px;
        cursor: pointer;
      }
    }
    .item-next {
      height: 24px;
      p {
        width: 100%;
        height: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        font-size: 14px;
        line-height: 22px;
        font-weight: 600;
        color: rgba($color: #ffffff, $alpha: 0.7);
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
          font-size: 14px;
          line-height: 22px;
        }
        i {
          line-height: 22px;
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
</style>
