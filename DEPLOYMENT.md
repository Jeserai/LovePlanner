# 🚀 GitHub Pages 部署指南

## 📋 准备工作

### 1. 推送代码到 GitHub

```bash
# 初始化 git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: LovePlanner App"

# 添加远程仓库（替换为你的GitHub用户名）
git remote add origin https://github.com/你的用户名/LovePlanner.git

# 推送到main分支
git push -u origin main
```

### 2. 启用 GitHub Pages

1. 打开你的 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**
5. 点击 **Save**

## 🔄 自动部署流程

当你推送代码到 `main` 分支时，GitHub Actions 会自动：

1. ✅ 检出代码
2. ✅ 安装 Node.js 和依赖
3. ✅ 构建静态文件
4. ✅ 部署到 GitHub Pages

## 🌐 访问你的应用

部署完成后，你的应用将在以下地址可用：
```
https://你的用户名.github.io/LovePlanner/
```

## 📝 部署状态检查

1. 在 GitHub 仓库页面点击 **Actions** 标签
2. 查看最新的工作流运行状态
3. 绿色✅表示部署成功，红色❌表示有错误

## 🔧 自定义域名（可选）

如果你有自己的域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容写入你的域名，如：`loveplanner.yourdomain.com`
3. 在你的域名提供商处设置 DNS 记录

## 📱 应用特性

你的 LovePlanner 应用现在已经是一个完整的 PWA：

- 🌐 **在线访问**：任何人都可以通过链接访问
- 💾 **本地存储**：每个用户的数据存储在自己的浏览器中
- 📱 **移动适配**：在手机和平板上都能正常使用
- 🎨 **双主题**：支持可爱主题和像素主题切换
- 👥 **双用户**：支持猫咪和奶牛两个角色

## 🔄 更新应用

当你想更新应用时：

```bash
# 修改代码后
git add .
git commit -m "描述你的更改"
git push origin main
```

GitHub Actions 会自动重新部署！

## 🐛 故障排除

### 构建失败
- 检查 Actions 页面的错误日志
- 确保所有依赖都在 `package.json` 中
- 本地运行 `npm run export` 测试

### 页面显示空白
- 检查浏览器控制台的错误信息
- 确认路径配置正确
- 清除浏览器缓存重试

### 数据丢失
- 数据存储在浏览器本地，清除浏览器数据会丢失
- 不同浏览器/设备的数据是独立的
- 考虑后续升级到云数据库 