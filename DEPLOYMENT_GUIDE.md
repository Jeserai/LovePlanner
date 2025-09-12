# 🚀 LovePlanner 部署指南

## 📋 概述

本指南介绍如何在不同环境中部署 LovePlanner 应用，包括开发环境、测试环境和生产环境的配置。

## 🔧 环境配置

### 环境变量

创建 `.env.local` 文件来配置环境变量：

#### 开发/测试环境配置
```bash
# 应用环境标识
NEXT_PUBLIC_APP_ENV=development

# 启用快速登录功能（仅测试用）
NEXT_PUBLIC_ENABLE_QUICK_LOGIN=true

# 启用调试功能
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=true
```

#### 生产环境配置
```bash
# 应用环境标识
NEXT_PUBLIC_APP_ENV=production

# 禁用快速登录功能（安全考虑）
NEXT_PUBLIC_ENABLE_QUICK_LOGIN=false

# 禁用调试功能
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=false
```

### 自动环境检测

如果不设置环境变量，应用会根据 `NODE_ENV` 自动判断：
- `NODE_ENV=production` → 生产模式（禁用快速登录）
- 其他情况 → 开发模式（启用快速登录）

## 🚦 功能控制

### 快速登录功能

- **开发/测试环境**：显示 Cat 🐱 和 Cow 🐮 两个预设用户的快速登录按钮
- **生产环境**：隐藏快速登录功能，用户只能通过邮箱密码登录

### 调试功能

- **开发/测试环境**：启用时区控制器、时间控制器等调试工具
- **生产环境**：禁用所有调试功能

## 📦 部署步骤

### 1. 开发环境部署

```bash
# 1. 克隆项目
git clone [repository-url]
cd LovePlanner

# 2. 安装依赖
npm install

# 3. 创建环境配置（可选，默认为开发模式）
echo "NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_QUICK_LOGIN=true
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=true" > .env.local

# 4. 启动开发服务器
npm run dev
```

### 2. 生产环境部署

```bash
# 1. 设置生产环境变量
echo "NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_ENABLE_QUICK_LOGIN=false
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=false" > .env.local

# 2. 构建应用
npm run build

# 3. 启动生产服务器
npm run start
```

### 3. 静态导出部署（GitHub Pages）

```bash
# 1. 设置导出模式
export BUILD_FOR_EXPORT=true

# 2. 构建静态文件
npm run build

# 3. 导出的文件在 out/ 目录中
# 上传 out/ 目录内容到静态托管服务
```

## 🔐 安全设置

### 生产环境安全检查清单

- [ ] ✅ 设置 `NEXT_PUBLIC_APP_ENV=production`
- [ ] ✅ 设置 `NEXT_PUBLIC_ENABLE_QUICK_LOGIN=false`
- [ ] ✅ 设置 `NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=false`
- [ ] ✅ 确保没有测试用户数据暴露
- [ ] ✅ 配置适当的 HTTPS 证书
- [ ] ✅ 设置适当的 CSP（内容安全策略）头部

### 密码安全

生产环境中用户可以通过以下方式修改密码：

1. 登录应用
2. 进入 **设置** 页面
3. 在 **密码和安全** 部分点击 **修改密码**
4. 输入当前密码和新密码
5. 新密码需要满足以下要求：
   - 至少 8 位字符
   - 包含大写字母
   - 包含小写字母
   - 包含数字
   - 包含特殊字符

## 🎯 环境验证

### 验证环境配置是否正确

打开浏览器控制台，查看以下信息：

#### 开发环境应该显示：
```
🌍 Environment Config: {
  current: "development",
  isProduction: false,
  enableQuickLogin: true,
  enableDebugFeatures: true,
  ...
}
```

#### 生产环境应该显示：
```
🌍 Environment Config: {
  current: "production",
  isProduction: true,
  enableQuickLogin: false,
  enableDebugFeatures: false,
  ...
}
```

### 功能验证

| 功能 | 开发环境 | 生产环境 |
|------|----------|----------|
| 快速登录按钮 | ✅ 显示 | ❌ 隐藏 |
| 时区控制器 | ✅ 可用 | ❌ 隐藏 |
| 时间控制器 | ✅ 可用 | ❌ 隐藏 |
| 修改密码 | ✅ 可用 | ✅ 可用 |
| 环境信息输出 | ✅ 显示 | ❌ 不显示 |

## 🔄 CI/CD 集成

### GitHub Actions 示例

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Set production environment
      run: |
        echo "NEXT_PUBLIC_APP_ENV=production" >> .env.local
        echo "NEXT_PUBLIC_ENABLE_QUICK_LOGIN=false" >> .env.local
        echo "NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=false" >> .env.local
        
    - name: Build application
      run: npm run build
      
    - name: Deploy to production
      # 添加你的部署步骤
      run: echo "Deploy to your hosting service"
```

## 🚨 故障排除

### 常见问题

1. **快速登录按钮仍然显示在生产环境**
   - 检查 `NEXT_PUBLIC_APP_ENV` 是否设置为 `production`
   - 确保 `NEXT_PUBLIC_ENABLE_QUICK_LOGIN` 设置为 `false`
   - 重新构建应用

2. **环境变量没有生效**
   - 确保 `.env.local` 文件在项目根目录
   - 确保环境变量以 `NEXT_PUBLIC_` 开头
   - 重启开发服务器

3. **修改密码功能不工作**
   - 检查用户是否已登录
   - 检查当前密码是否正确
   - 检查新密码是否符合强度要求

## 📞 支持

如果遇到部署问题，请：

1. 检查控制台错误信息
2. 验证环境配置
3. 查看构建日志
4. 联系开发团队

---

**注意**：此部署指南基于 LovePlanner v1.0.0，请根据实际版本调整配置。

