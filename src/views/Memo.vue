<template>
  <div class="root">
      <transition>
              <textarea class="scrollbar scrollbar-y"
                v-model="content"
                spellcheck="false"
              />
      </transition>
  </div>
</template>

<script>
import DB from "@/utils/db";
import { ipcRenderer } from "electron";
import { v4 as uuidv4 } from 'uuid';
import { getNowDate, getNowDateTime } from "@/utils/common";

export default {
  name: "Memo",
  data() {
    return {
      pageName: 'memo',
      memoData: null,
      content: ''
    };
  },
  methods: {
    getMemoData(id) {
      if (id == '') {
        id = uuidv4();
        let list = DB.get("memoList");
        list.push({
          memo_date: getNowDate(),
          memo_datetime: getNowDateTime(),
          title: "",
          content: "",
          id: id
        });
        DB.set("memoList", list);
        this.$route.query.id = id;
        ipcRenderer.invoke("setMemoWindows", id, this.$route.query.timestamp);
      }
      this.memoData = DB.getById("memoList", id);
      this.content = this.memoData.content;
      
    },
    saveData() {
      setInterval(() => {
        if (this.memoData !== null) {
          if (this.memoData.content !== this.content) {
            this.memoData.content = this.content;
            console.info(this.memoData);
            DB.updateById("memoList", this.memoData.id, this.memoData);
          }
        }
      }, 1000);
    }
  },
  created() {
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath);
      let id = this.$route.query.id;
      this.getMemoData(id);
    });
    this.saveData();
  },
};
</script>

<style lang="scss" scoped>
.root {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 15px 28px 15px;
  textarea {
    flex: 1;
    height: 100%;
    width: 100%;
    outline: none;
    border: none;
    background: transparent;
    font-size: 16px;
    line-height: 28px;
    resize: none;
    display: flex;
    justify-content: space-between;
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
