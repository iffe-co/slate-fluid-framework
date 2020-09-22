# slate-fluid-framework
a adapter for slate to fluidFramework

## 常用命令 1

### 启动项目

```
# 首次启动项目
yarn && lerna bootstrap

# 启动 demo
yarn start [-p packageName]

ex: yarn start -p slate-fluid

```

### 提交代码

```
# 提交代码
yarn commit

# push到远程仓库
yarn push

# 拉取代码
yarn pull
```

### 编译

```
# 编译全部packages
yarn build

# 编译单个package
yarn build -p [packageName]
```

### 增加依赖

```
# 给单个package安装依赖
lerna add [module-1] --scope=[packageName2]

# 给所有package安装依赖
lerna add [module-1]
```

### 创建新 package

```
# 创建一个新package
lerna create [packageName]
```

## 项目脚手架说明

> 脚手架采用 monorepos 模式进行代码组织，即表示一个 repo（Repository）管理多个 packages，区别于 Multirepos 的方式。优缺点可参考：[babel 为什么采用 monorepos 模式管理](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

- `lerna` （已集成）monorepos 管理工具 [文档](https://github.com/lerna/lerna/)
- `rollup` （已集成）打包工具 [文档](https://rollupjs.org/guide/en)
- `babel` （已集成）JS 语法编译器 [文档](https://babeljs.io)
- `typescript` （已集成）支持 ts 编译 [文档](https://www.typescriptlang.org)
- `jest` （尚未集成）代码测试框架
- `eslint` + `prettier` (已集成) 代码质量及风格管理 [文档](https://cn.eslint.org/)
- `husky` （尚未集成）用于 git 提交的规范控制

## Rollup 打包类型说明：

- amd : 异步模块定义，用于像 RequireJS 这样的模块加载器
- cjs : CommonJS，适用于 Node 和 Browserify/Webpack
- es : 将软件包保存为 ES 模块文件，在现代浏览器中可以通过 <script type=module> 标签引入
- iife : 一个自动执行的功能，适合作为<script>标签。（如果要为应用程序创建一个捆绑包，您可能想要使用它，因为它会使文件大小变小。）
- umd : 通用模块定义，以 amd，cjs 和 iife 为一体
- system : SystemJS 加载器格式

## 一些使用到的工具

- `npm-run-all` [文档](https://github.com/mysticatea/npm-run-all)
