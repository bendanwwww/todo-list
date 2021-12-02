<template>
  <div class="root">
    <div class="list" >
      <transition>
        <div class="item" >
            <div class="edit" >
              <textarea
                v-model="data"
                v-focus
                spellcheck="false"
              />
            </div>
        </div>
      </transition>
    </div>
  </div>
</template>
<script>

export default {
  name: "Memo",
  data() {
    return {
      data: null,
    };
  },
  methods: {
    getTodoList() {
      this.data = "";
    }
  },
  created() {
    this.getTodoList();
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
      height: 100%;
      .edit {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        textarea {
          flex: 1;
          height: 1000px;
          outline: none;
          border: none;
          background: transparent;
          font-size: 16px;
          line-height: 28px;
          resize: none;
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
