// vue.config.js

module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "xhznl-todo-list",
        productName: "xhznl-todo-list",
        copyright: "Copyright © 2021 lsy & Ankh",
        // directories: {
        //   output: "./dist", //输出文件路径
        // },
        win: {
          icon: "./public/todoicon.png",
          target: "nsis",
        },
        mac: {
          icon: "./public/todoicon.png",
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          shortcutName: "xhznl-todo-list",
        },
        publish: ["github"],
        // releaseInfo: {
        //   releaseName: "",
        //   releaseNotes: "",
        //   releaseDate: "",
        // },
      },
      nodeIntegration: true,
    },
  },
  configureWebpack: {
    externals: {},
  },
};
