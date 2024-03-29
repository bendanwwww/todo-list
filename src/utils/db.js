import Datastore from "lowdb";
import LodashId from "lodash-id";
import FileSync from "lowdb/adapters/FileSync";
import path from "path";
import fs from "fs-extra";

import { getNowDate, getNowDateTime } from "@/utils/common";

const isDevelopment = process.env.NODE_ENV !== "production";

let db;

const DB = {
  initDB(storePath) {
    if (!fs.pathExistsSync(storePath)) {
      fs.mkdirpSync(storePath);
    }

    const dbFile = isDevelopment ? "/data-dev.json" : "/data.json";

    const adapter = new FileSync(path.join(storePath, dbFile));

    db = Datastore(adapter);

    db._.mixin(LodashId);

    db.defaults({
      app_id: "",
      todoList: [
        {
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "“单击”下方空处，创建一个Todo",
          type: "short",
          important: 0,
          pin: false,
          todo_item_list: [
            {
              content: "你可以在这里创建子任务",
              important: 0
            }
          ]
        },
        {
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "“双击”Todo，表示已完成",
          type: "short",
          important: 0,
          pin: false,
          todo_item_list: []
        },
        {
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "“单击”Todo，可进行更改或删除",
          type: "short",
          important: 0,
          pin: false,
          todo_item_list: []
        },
        {
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "“长按”Todo，可进行拖动排序",
          type: "short",
          important: 0,
          pin: false,
          todo_item_list: []
        },
        {
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "【重要】给项目点一个star",
          type: "short",
          important: 0,
          pin: false,
          todo_item_list: []
        },
      ],
      longTodoList: [
        {
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "这里可以记录一些你的长期计划～",
          type: "long",
          important: 0,
          todo_item_list: []
        }
      ],
      doneList: [
        {
          done_date: getNowDate(),
          done_datetime: getNowDateTime(),
          todo_date: getNowDate(),
          todo_datetime: getNowDateTime(),
          content: "【重要】给爱的人一个温暖的拥抱",
          id: "272aa857-bd53-44fb-b6fc-49d4ef595ade",
          type: "long",
          important: 1,
          pin: false,
          todo_item_list: []
        },
      ],
      memoList: [
        {
          id: "3ea92744-145a-41b2-90f8-fdc0972f93bb",
          memo_date: getNowDate(),
          memo_datetime: getNowDateTime(),
          title: "",
          content: "这是一个测试memo, 你可以在此记录文字、备忘录以及很多idea～"
        }
      ],
      settings: {
        shrink_windows_size: [40, 40]
      },
    }).write();

    if (!this.has("settings.firstRun")) {
      this.set("settings.firstRun", true);
    }
  },
  has(key) {
    return db
      .read()
      .has(key)
      .value();
  },
  get(key) {
    return db
      .read()
      .get(key)
      .value();
  },
  set(key, value) {
    return db
      .read()
      .set(key, value)
      .write();
  },
  insert(key, value) {
    return db
      .read()
      .get(key)
      .insert(value)
      .write();
  },
  removeById(key, id) {
    return db
      .read()
      .get(key)
      .removeById(id)
      .write();
  },
  getById(key, id) {
    return db
    .read()
    .get(key)
    .find({id: id})
    .value();
  },
  updateById(key, id, value) {
    return db
    .read()
    .get(key)
    .find({id: id})
    .assign(value)
    .write();
  },
  groupby(key, prop) {
    const d = db
      .read()
      .get(key)
      .sortBy(prop)
      .reverse()
      .groupBy(prop)
      .value();
    return d;
  },
};

export default DB;
