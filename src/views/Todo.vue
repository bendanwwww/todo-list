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
        <div v-for="(todo, index) in todoList" :key="'todo' + index">
          <div class="item"
            @dblclick.stop="done($event, index)"
            @click.stop="editing(index)"
            @mouseenter="moveItem(index)"
            @mouseleave="leaveItem(index)">
            <div class="edit" v-if="index !== editIndex">
              <p>{{todo.important == 1 ? '★' : ''}} {{ index + 1 }}.{{ todo.content }}</p>
              <i v-if="index == moveIndex" class="iconfont icon-add-bold" @click.stop="addItem(index)"></i>
              <i v-if="index == moveIndex" 
              :class="['iconfont', inDropList(index) ? 'icon-arrow-up-bold' : 'icon-arrow-down-bold']" 
              @click.stop="dropItem(index)"></i>
            </div>
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
              <i v-if="todo.content !== ''" class="iconfont icon-run-in" @click.stop="addLongTodo($event, index)"></i>
              <i class="iconfont icon-select" @click.stop="edited"></i>
              <i class="iconfont icon-close" @click.stop="clear(index)"></i>
            </div>
          </div>
          <div v-for="(item, item_index) in todoList[index].todo_item_list" :key="'todo_item' + item_index">
            <div class="item-next" 
              v-if="inDropList(index)" 
              @click.stop="editingItem(index, item_index)"
              @mouseenter="moveItemChild(index, item_index)"
              @mouseleave="leaveItemChild(index, item_index)">
              <div class="edit" v-if="item_index !== editItemIndex || index !== editItemParentIndex">
                <p>({{ item_index + 1 }}) {{item.content}}  {{item.important == 1 ? '【已完成】' : ''}}</p>
                <i v-if="index == moveItemParentIndex && item_index == moveItemIndex && item.important !== 1"
                  class="iconfont icon-success" @click.stop="doneItem(index, item_index)"></i>
                <i v-if="index == moveItemParentIndex && item_index == moveItemIndex && item.important == 1"
                  class="iconfont icon-skip" @click.stop="doneReturnItem(index, item_index)"></i>
              </div>
              <div class="edit" v-else>
                <input
                  v-model="item.content"
                  v-focus
                  @click.stop="return false;"
                  @keyup.27="cancel(index)"
                  @keyup.13="editedItem(index, item_index)"
                  spellcheck="false"
                />
                <i class="iconfont icon-select" @click.stop="editedItem(index, item_index)"></i>
                <i class="iconfont icon-close" @click.stop="clearItem(index,  item_index)"></i>
              </div>
            </div>
          </div>
          <!-- <div class="item-next" v-if="inDropList(index)">
            <p>(2) 测试子任务2</p>
          </div> -->
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
      pageName: 'todo',
      todoList: null,
      drag: false,
      moveIndex: -1,
      moveItemParentIndex: -1,
      moveItemIndex: -1,
      editIndex: -1,
      editItemIndex: -1,
      editItemParentIndex: -1,
      tempItem: null,
      dblclick: false,
      dropDownList: []
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
      const list = DB.get("todoList");
      this.todoList = this.addMethods(list);
      console.info(this.todoList[0].type);
      console.info(this.todoList[0].important);
    },
    addStar(index) {
      this.todoList[index].important == 0 
      ? this.todoList[index].important = 1 
      : this.todoList[index].important = 0;
    },
    moveItem(index) {
      this.moveIndex = index;
    },
    leaveItem(index) {
      if (this.moveIndex == index) {
        this.moveIndex = -1;
      }
    },
    moveItemChild(index, itemIndex) {
      this.moveItemParentIndex = index
      this.moveItemIndex = itemIndex;
    },
    leaveItemChild(index, itemIndex) {
      if (this.moveItemParentIndex == index && this.moveItemIndex == itemIndex) {
        this.moveItemParentIndex = -1
        this.moveItemIndex = -1;
      }
    },
    dropItem(index) {
      if (this.moveIndex == index) {
        let dropIndex = this.dropDownList.indexOf(index)
        if (dropIndex > -1) {
          this.dropDownList.splice(dropIndex, 1);
        } else {
          this.dropDownList.push(index);
        }
      }
    },
    inDropList(index) {
      return this.dropDownList.indexOf(index) > -1;
    },
    reduceRefashDropList(index) {
      let dropIndex = this.dropDownList.indexOf(index)
      if (dropIndex > -1) {
        this.dropDownList.splice(dropIndex, 1);
      }
      for (var i = 0 ; i < this.dropDownList.length ; i++) {
        if (this.dropDownList[i] > index) {
          this.dropDownList[i] -= 1;
        }
      }
      let removeIndex = this.dropDownList.indexOf(-1)
      if (removeIndex > -1) {
        this.dropDownList.splice(removeIndex, 1);
      }
    },
    add() {
      if (this.editIndex !== -1) {
        this.edited();
        return;
      }
      if (this.editItemIndex !== -1) {
        this.editedItem(this.editItemParentIndex);
        return;
      }
      this.todoList.push({
        todo_date: getNowDate(),
        todo_datetime: getNowDateTime(),
        content: "",
        type: "short",
        important: 0
      });
      const index = this.todoList.length - 1;
      this.tempItem = Object.assign({}, this.todoList[index]);
      this.editIndex = index;
    },
    addItem(index) {
      if (this.editItemIndex !== -1) {
        this.editedItem(index);
        return;
      }
      if (this.todoList[index].todo_item_list == undefined) {
        this.todoList[index].todo_item_list = [];
      }
      this.todoList[index].todo_item_list.push({
        content: "",
        important: 0
      });
      const itemIndex = this.todoList[index].todo_item_list.length - 1;
      this.tempItem = Object.assign({}, this.todoList[index]);
      this.editItemParentIndex = index;
      this.editItemIndex = itemIndex;
      if (!this.inDropList(index)) {
        this.dropItem(index);
      }
    },
    editingItem(index, itemIndex) {
      setTimeout(() => {
        if (this.dblclick) {
          return;
        }
        if (this.editItemIndex !== -1) {
          this.editedItem(index);
        }
        this.tempItem = Object.assign({}, this.todoList[index]);
        this.editItemParentIndex = index;
        this.editItemIndex = itemIndex;
      }, 220);
    },
    editedItem(index) {
      this.todoList[index].todo_item_list = this.todoList[index].todo_item_list.filter((p) => {
        return p.content;
      });
      this.editItemIndex = -1;
      this.editItemParentIndex = -1;
      DB.set("todoList", this.todoList);
    },
    clearItem(index, itemIndex) {
      this.todoList[index].todo_item_list[itemIndex].content = "";
      this.editedItem(index);
    },
    doneItem(index, itemIndex) {
      if (this.editItemIndex !== -1) {
        return;
      }
      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);
      this.todoList[index].todo_item_list[itemIndex].important = 1;
      DB.set("todoList", this.todoList);
    },
    doneReturnItem(index, itemIndex) {
      if (this.editItemIndex !== -1) {
        return;
      }
      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);
      this.todoList[index].todo_item_list[itemIndex].important = 0;
      DB.set("todoList", this.todoList);
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
      DB.set("todoList", this.todoList);
    },
    cancel(index) {
      this.$set(this.todoList, index, this.tempItem);
      this.edited();
    },
    clear(index) {
      this.todoList[index].content = "";
      this.edited();
      this.reduceRefashDropList(index);
    },
    done(event, index) {
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
      this.reduceRefashDropList(index);
      DB.set("todoList", this.todoList);
    },
    addLongTodo(event, index) {
      if (this.editIndex === -1) {
        return;
      }
      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);
      // CursorSpecialEffects.handleMouseDown(event);
      this.todoList[index].type = "long";
      DB.insert(
        "longTodoList",
        Object.assign(
          this.todoList[index]
        )
      );
      this.todoList.splice(index, 1);
      this.reduceRefashDropList(index);
      DB.set("todoList", this.todoList);
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
    .item-next {
      height: 22px;
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
    .item-next:hover {
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
