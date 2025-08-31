# 🤝 合作伙伴部署指南

## 📋 概述

本指南将帮助您的合作伙伴在他的电脑上设置和运行LovePlanner应用。

## 🛠️ 前置要求

### 1. 安装必要软件
```bash
# 1. 安装Node.js (推荐版本 18.x 或更高)
# 访问 https://nodejs.org/ 下载并安装

# 2. 验证安装
node --version  # 应该显示 v18.x.x 或更高
npm --version   # 应该显示 9.x.x 或更高

# 3. 安装Git (如果还没有)
# 访问 https://git-scm.com/ 下载并安装
git --version   # 验证安装
```

## 📦 获取项目代码

### 方法1: 通过Git克隆（推荐）
```bash
# 1. 克隆项目仓库
git clone [您的仓库地址]
cd LovePlanner

# 2. 安装依赖
npm install
```

### 方法2: 下载压缩包
```bash
# 1. 下载项目压缩包并解压
# 2. 进入项目目录
cd LovePlanner

# 3. 安装依赖
npm install
```

## 🔧 环境配置

### 1. 创建环境变量文件
```bash
# 在项目根目录创建 .env.local 文件
touch .env.local
```

### 2. 配置Supabase连接
在 `.env.local` 文件中添加以下内容：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=您的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=您的Supabase匿名密钥

# 可选：开发环境标识
NODE_ENV=development
```

**获取Supabase配置信息：**
1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目
3. 进入 Settings → API
4. 复制 `Project URL` 和 `anon public` 密钥

## 🗄️ 数据库设置

### 1. 确保数据库结构最新
在Supabase SQL编辑器中执行以下脚本：

```sql
-- 执行最新的数据库结构脚本
-- 文件位置: database/smart_task_setup.sql
-- 或者: database/fixed_simple_task_setup.sql
```

### 2. 验证数据库连接
```bash
# 启动开发服务器测试连接
npm run dev
```

## 🚀 启动应用

### 1. 开发模式启动
```bash
# 启动开发服务器
npm run dev

# 应用将在以下地址运行:
# http://localhost:3000
```

### 2. 生产模式启动
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 👥 用户账户设置

### 1. 创建账户
1. 访问 `http://localhost:3000`
2. 点击"注册"创建新账户
3. 使用邮箱验证（如果启用）

### 2. 建立情侣关系
**方法1: 通过邀请码（推荐）**
```sql
-- 在Supabase SQL编辑器中执行
-- 假设用户1 ID: 6ec5465b-05c7-4f1e-8efd-ed487d785364
-- 假设用户2 ID: f58b5791-c5f8-4d47-97eb-68f32d0e21f2

INSERT INTO couples (user1_id, user2_id, is_active)
VALUES (
  '6ec5465b-05c7-4f1e-8efd-ed487d785364',
  'f58b5791-c5f8-4d47-97eb-68f32d0e21f2',
  true
);
```

**方法2: 通过应用界面**
1. 一方发送邀请
2. 另一方接受邀请
3. 系统自动建立情侣关系

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 2. 端口占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
kill -9 [进程ID]

# 或者使用其他端口
npm run dev -- -p 3001
```

#### 3. 数据库连接失败
- 检查 `.env.local` 文件中的Supabase配置
- 确认网络连接正常
- 验证Supabase项目状态

#### 4. 构建错误
```bash
# 检查TypeScript错误
npm run type-check

# 检查ESLint错误
npm run lint

# 修复可自动修复的问题
npm run lint -- --fix
```

## 📱 移动端访问

### 1. 局域网访问
```bash
# 启动时绑定到所有网络接口
npm run dev -- --host 0.0.0.0

# 通过局域网IP访问
# 例如: http://192.168.1.100:3000
```

### 2. 获取局域网IP
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
# 或
ip addr show
```

## 🔄 保持同步

### 1. 获取最新代码
```bash
# 拉取最新更改
git pull origin main

# 更新依赖
npm install

# 重启开发服务器
npm run dev
```

### 2. 数据库迁移
```bash
# 当数据库结构更新时
# 在Supabase中执行新的迁移脚本
```

## 🛡️ 安全注意事项

### 1. 环境变量安全
- ❌ 不要将 `.env.local` 文件提交到Git
- ✅ 确保 `.env.local` 在 `.gitignore` 中
- ✅ 使用不同的Supabase项目进行开发和生产

### 2. 数据库安全
- ✅ 定期备份数据库
- ✅ 使用Row Level Security (RLS)
- ✅ 限制API访问权限

## 📞 技术支持

### 获取帮助
1. **查看日志**: 浏览器开发者工具 → Console
2. **检查网络**: 开发者工具 → Network
3. **数据库日志**: Supabase Dashboard → Logs

### 联系方式
- 项目维护者: [您的联系方式]
- 文档: 项目README.md
- 问题反馈: [GitHub Issues链接]

## 🎯 快速检查清单

部署完成后，请确认以下功能正常：

- [ ] ✅ 应用启动成功 (http://localhost:3000)
- [ ] ✅ 用户注册/登录功能
- [ ] ✅ 数据库连接正常
- [ ] ✅ 任务创建功能
- [ ] ✅ 日历功能
- [ ] ✅ 主题切换功能
- [ ] ✅ 情侣关系建立
- [ ] ✅ 实时数据同步

## 🚀 下一步

部署成功后，您的合作伙伴可以：
1. 创建和管理任务
2. 查看和编辑日历事件
3. 与您实时协作
4. 自定义应用主题
5. 管理个人资料和设置

---

**🎉 恭喜！您的合作伙伴现在可以开始使用LovePlanner了！**
