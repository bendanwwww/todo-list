<template>
  <div class="root" @click="add">
    <draggable
      class="list"
      v-model="todoList"
      v-bind="dragOptions"
      @start="drag = true"
      @end="drag = false"
      :disabled="editIndex !== -1"
    >
      <transition-group type="transition" :name="!drag ? 'flip-list' : null">
        <div
          class="item"
          v-for="(todo, index) in todoList"
          :key="'todo' + index"
          @dblclick.stop="done($event, index)"
          @click.stop="editing(index)"
        >
          <p v-if="index !== editIndex">{{todo.important == 1 ? '★' : ''}} {{ index + 1 }}.{{ todo.content }}</p>
          <div class="edit" v-else>
            <input
              v-model="todo.content"
              v-focus
              @click.stop="return false;"
              @keyup.27="cancel(index)"
              @keyup.13="edited"
              spellcheck="false"
            />
            <i :class="['iconfont', todo.important == 0 ? 'icon-favorite' : 'icon-favorite-filling']" @click.stop="addStar(index)"></i>
            <i v-if="todo.content !== ''" class="iconfont icon-run-up" @click.stop="addTodo($event, index)"></i>
            <i class="iconfont icon-select" @click.stop="edited"></i>
            <i class="iconfont icon-close" @click.stop="clear(index)"></i>
          </div>
        </div>
      </transition-group>
    </draggable>
  </div>
</template>
<script>
import draggable from "vuedraggable";
import CursorSpecialEffects from "@/utils/fireworks";
import { ipcRenderer } from "electron";
import DB from "@/utils/db";
import { getNowDate, getNowDateTime } from "@/utils/common";

export default {
  name: "Todo",
  components: {
    draggable,
  },
  data() {
    return {
      pageName: 'longTodo',
      todoList: null,
      drag: false,
      editIndex: -1,
      tempItem: null,
      dblclick: false,
    };
  },
  methods: {
    // 兼容性赋值
    addMethods(list) {
      for (var i = 0 ; i < list.length ; i++) {
        list[i].type === undefined ? list[i].type = "short" : null;
        list[i].important === undefined ? list[i].important = "0" : null;
      }
      return list;
    },
    getTodoList() {
      const list = DB.get("longTodoList");
      this.todoList = this.addMethods(list);
    },
    addStar(index) {
      this.todoList[index].important == 0 
      ? this.todoList[index].important = 1 
      : this.todoList[index].important = 0;
    },
    add() {
      if (this.editIndex !== -1) {
        this.edited();
        return;
      }
      this.todoList.push({
        todo_date: getNowDate(),
        todo_datetime: getNowDateTime(),
        content: "",
        type: "long",
        important: 0
      });
      const index = this.todoList.length - 1;
      this.tempItem = Object.assign({}, this.todoList[index]);
      this.editIndex = index;
      //this.editing(index);
    },
    editing(index) {
      setTimeout(() => {
        if (this.dblclick) {
          return;
        }
        if (this.editIndex !== -1) {
          this.edited();
        }
        this.tempItem = Object.assign({}, this.todoList[index]);
        this.editIndex = index;
      }, 220);
    },
    edited() {
      this.todoList = this.todoList.filter((p) => {
        return p.content;
      });
      this.editIndex = -1;
      DB.set("longTodoList", this.todoList);
    },
    cancel(index) {
      this.$set(this.todoList, index, this.tempItem);
      this.edited();
    },
    clear(index) {
      if (!this.todoList[index].content) {
        this.edited();
        return;
      }
      this.todoList[index].content = "";
    },
    done(event, index) {
      console.info(this.editIndex);
      if (this.editIndex !== -1) {
        return;
      }
      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);
      CursorSpecialEffects.handleMouseDown(event);
      DB.insert(
        "doneList",
        Object.assign(
          { done_date: getNowDate(), done_datetime: getNowDateTime() },
          this.todoList[index]
        )
      );
      this.todoList.splice(index, 1);
      DB.set("longTodoList", this.todoList);
    },
    addTodo(event, index) {
      if (this.editIndex === -1) {
        return;
      }
      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);
      // CursorSpecialEffects.handleMouseDown(event);
      this.todoList[index].type = "short";
      DB.insert(
        "todoList",
        Object.assign(
          this.todoList[index]
        )
      );
      this.todoList.splice(index, 1);
      DB.set("longTodoList", this.todoList);
    },
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
      this.getTodoList();
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
