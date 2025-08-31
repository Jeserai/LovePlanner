# 🔧 故障排除指南

## 🚨 常见问题及解决方案

### 1. 依赖安装问题

#### 问题：`npm install` 失败
```bash
# 解决方案1：清除缓存
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 解决方案2：使用yarn (如果npm持续失败)
npm install -g yarn
yarn install

# 解决方案3：检查Node.js版本
node --version  # 确保 >= 18.0.0
```

#### 问题：权限错误 (macOS/Linux)
```bash
# 使用sudo (不推荐)
sudo npm install

# 推荐：修复npm权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 2. 端口占用问题

#### 问题：端口3000被占用
```bash
# 查看占用进程
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# 解决方案1：杀死进程
kill -9 [进程ID]

# 解决方案2：使用其他端口
npm run dev -- -p 3001
```

### 3. 数据库连接问题

#### 问题：Supabase连接失败
**检查清单：**
- [ ] `.env.local` 文件存在且配置正确
- [ ] Supabase URL格式正确 (https://xxx.supabase.co)
- [ ] 匿名密钥正确且有效
- [ ] 网络连接正常
- [ ] Supabase项目状态正常

**解决步骤：**
```bash
# 1. 验证环境变量
cat .env.local

# 2. 测试网络连接
curl -I https://your-project.supabase.co

# 3. 检查浏览器控制台错误
# 打开开发者工具 → Console 查看错误信息
```

#### 问题：数据库表不存在
```sql
-- 在Supabase SQL编辑器中执行
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'tasks';

-- 如果不存在，执行设置脚本
-- database/smart_task_setup.sql
```

### 4. 构建和启动问题

#### 问题：TypeScript错误
```bash
# 检查类型错误
npm run type-check

# 常见修复
# 1. 重启TypeScript服务器 (VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")
# 2. 删除 .next 文件夹
rm -rf .next
npm run dev
```

#### 问题：ESLint错误
```bash
# 检查代码质量
npm run lint

# 自动修复
npm run lint -- --fix

# 忽略特定错误 (临时方案)
# 在代码行前添加: // eslint-disable-next-line
```

#### 问题：样式不生效
```bash
# 清除Next.js缓存
rm -rf .next

# 重新安装Tailwind CSS
npm install tailwindcss postcss autoprefixer

# 检查CSS文件导入
# 确保 globals.css 在 _app.tsx 中正确导入
```

### 5. 用户认证问题

#### 问题：无法注册/登录
**检查清单：**
- [ ] Supabase Auth设置正确
- [ ] 邮箱验证配置 (如果启用)
- [ ] RLS (Row Level Security) 策略正确
- [ ] 网络连接稳定

**解决步骤：**
1. 检查Supabase Dashboard → Authentication
2. 查看用户表是否正常
3. 检查浏览器控制台错误
4. 尝试重置密码功能

### 6. 性能问题

#### 问题：应用加载缓慢
```bash
# 分析构建大小
npm run build
npm run analyze  # 如果配置了bundle analyzer

# 优化建议
# 1. 启用生产模式
npm run build && npm start

# 2. 检查网络请求
# 浏览器开发者工具 → Network

# 3. 清除浏览器缓存
```

### 7. 移动端问题

#### 问题：移动端显示异常
- 检查响应式设计
- 测试不同屏幕尺寸
- 验证触摸事件
- 检查viewport设置

### 8. 开发环境问题

#### 问题：热重载不工作
```bash
# 重启开发服务器
npm run dev

# 检查文件监听
# 确保项目不在网络驱动器上
# 检查防火墙设置
```

#### 问题：环境变量不生效
```bash
# 重启开发服务器
# 环境变量更改后必须重启

# 检查变量名
# Next.js客户端变量必须以 NEXT_PUBLIC_ 开头
```

## 🔍 调试技巧

### 1. 浏览器开发者工具
- **Console**: 查看JavaScript错误
- **Network**: 检查API请求
- **Application**: 查看本地存储
- **Sources**: 设置断点调试

### 2. 服务器日志
```bash
# 查看详细日志
npm run dev -- --verbose

# 检查构建日志
npm run build 2>&1 | tee build.log
```

### 3. 数据库调试
- Supabase Dashboard → Logs
- SQL编辑器测试查询
- 检查RLS策略

## 📞 获取帮助

### 1. 收集错误信息
- 完整的错误消息
- 浏览器控制台截图
- 操作系统和版本
- Node.js和npm版本
- 重现步骤

### 2. 联系支持
- 项目维护者: [联系方式]
- 技术文档: README.md
- 社区支持: [论坛/Discord链接]

### 3. 有用的命令
```bash
# 系统信息
node --version
npm --version
npm list --depth=0

# 项目信息
npm run info  # 如果配置了
git log --oneline -5

# 清理重置
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

## ⚡ 快速修复脚本

创建 `quick-fix.sh`:
```bash
#!/bin/bash
echo "🔧 执行快速修复..."
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
echo "✅ 修复完成！运行 npm run dev 启动应用。"
```

---

**💡 提示**: 大多数问题可以通过重启开发服务器或清除缓存解决。遇到问题时，首先尝试这些基本步骤。
