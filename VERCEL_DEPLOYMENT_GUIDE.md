# Vercel 部署指南

## 🚀 部署到 Vercel

### 1. 环境变量配置

在 Vercel Dashboard 中设置以下环境变量来确保正式环境的行为：

#### 正式环境配置（推荐）
```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_ENABLE_QUICK_LOGIN=false
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=false
```

#### 测试环境配置（可选）
```bash
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_QUICK_LOGIN=true
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=true
```

### 2. 环境变量设置步骤

1. 登录到 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加上述环境变量：
   - **Name**: `NEXT_PUBLIC_APP_ENV`
   - **Value**: `production`
   - **Environments**: 选择 `Production`
   
5. 重复添加其他变量
6. 重新部署项目

### 3. 功能差异说明

#### 🏭 **正式环境 (Production)**
- **快速登录**: 用户需要先手动登录，然后才能使用快速登录
- **调试工具**: 隐藏时区测试和时间控制器
- **安全性**: 密码加密存储，7天过期
- **账号管理**: 最多保存3个账号，自动清理过期数据

#### 🧪 **测试环境 (Development)**
- **快速登录**: 直接提供 cat@loveplanner.com 和 cow@loveplanner.com 的快速登录
- **调试工具**: 显示所有调试功能
- **安全性**: 密码加密存储，30天过期
- **账号管理**: 最多保存3个账号

### 4. 快速登录机制详解

#### 测试环境
```
✅ 显示预设用户选项
✅ 点击即可直接登录（包含密码）
✅ 无需手动输入任何信息
```

#### 正式环境
```
✅ 首次登录需要手动输入账号密码
✅ 登录成功后自动保存到安全存储
✅ 下次访问显示已保存的账号，点击快速登录
✅ 密码加密存储，定期自动过期
```

### 5. 安全特性

- **加密存储**: 使用简单加密算法保护本地密码
- **自动过期**: 正式环境7天，测试环境30天
- **账号限制**: 最多保存3个账号
- **一键清除**: 在设置页面可以清除所有已保存账号

### 6. 部署检查清单

在部署之前，确认：

- [ ] ✅ 环境变量已正确设置
- [ ] ✅ `NEXT_PUBLIC_APP_ENV=production`
- [ ] ✅ 代码中没有硬编码的测试数据
- [ ] ✅ Supabase 配置正确
- [ ] ✅ 数据库连接正常

### 7. 验证部署结果

部署完成后，访问网站验证：

1. **登录页面**: 不应显示预设用户的快速登录选项
2. **调试工具**: 时区测试和时间控制器应该隐藏
3. **快速登录**: 需要先手动登录一次才会显示
4. **密码修改**: 应该连接到真实的 Supabase Auth

### 8. 常见问题

#### Q: 为什么部署后还是显示测试环境的功能？
A: 检查环境变量是否正确设置，特别是 `NEXT_PUBLIC_APP_ENV=production`

#### Q: 快速登录不工作了？
A: 正式环境需要先手动登录一次，然后才会显示快速登录选项

#### Q: 如何切换回测试模式？
A: 修改环境变量 `NEXT_PUBLIC_APP_ENV=development` 并重新部署

### 9. 性能优化建议

- 使用 Vercel 的 Edge Functions 来优化全球访问速度
- 启用 Vercel Analytics 来监控应用性能
- 配置适当的缓存策略

---

## 🎯 总结

通过正确配置环境变量，您可以确保：
- **测试环境**: 快速开发和调试
- **正式环境**: 安全、可靠的用户体验

代码是同一套，只需要通过环境变量来控制不同的行为！🚀

