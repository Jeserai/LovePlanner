# 🤝 LovePlanner - 合作伙伴快速开始

## 🚀 三步快速开始

### 1️⃣ 运行设置脚本
```bash
# macOS/Linux
chmod +x setup-partner.sh
./setup-partner.sh

# Windows
setup-partner.bat
```

### 2️⃣ 配置Supabase
编辑 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 3️⃣ 启动应用
```bash
npm run dev
```
访问: http://localhost:3000

## 📋 系统要求

- **Node.js**: v18.0.0 或更高版本
- **npm**: v9.0.0 或更高版本
- **浏览器**: Chrome, Firefox, Safari, Edge (最新版本)

## 🔧 获取Supabase配置

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🗄️ 数据库设置

在Supabase SQL编辑器中执行：
```sql
-- 复制并执行以下文件内容：
database/smart_task_setup.sql
```

## 🎯 功能验证

启动后确认以下功能：
- [ ] 用户注册/登录
- [ ] 创建任务
- [ ] 查看日历
- [ ] 主题切换

## ❓ 遇到问题？

### 常见解决方案
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install

# 使用其他端口
npm run dev -- -p 3001

# 检查错误
npm run lint
```

### 获取帮助
- 📖 详细指南: `COLLABORATION_SETUP_GUIDE.md`
- 🐛 问题反馈: [联系项目维护者]

## 🎉 开始使用

设置完成后，您可以：
- ✨ 创建和管理任务
- 📅 规划日程安排
- 🎨 自定义主题
- 💕 与伴侣实时协作

---
**💡 提示**: 首次使用建议先创建一个测试任务，熟悉界面操作。
