# Vercel 部署指南

## 🚀 部署到 Vercel

### 1. 环境变量配置

在 Vercel Dashboard 中设置以下环境变量来确保正式环境的行为：

#### 正式环境配置（推荐）
```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_ENABLE_DEBUG_FEATURES=false
```

#### 测试环境配置（可选）
```bash
NEXT_PUBLIC_APP_ENV=development
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
- **登录方式**: 使用 Supabase 官方会话管理，仅邮箱密码登录
- **调试工具**: 完全隐藏（时区测试、时间控制器、Session监控器）
- **安全性**: 零密码存储，仅保存邮箱地址便于重登录
- **会话管理**: 完全依赖 Supabase 自动刷新和持久化

#### 🧪 **测试环境 (Development)**
- **登录方式**: 预设用户快速登录 + 普通邮箱密码登录
- **调试工具**: 显示所有调试功能（时间控制、时区、Session监控）
- **安全性**: 仅保存邮箱地址，无密码存储
- **会话管理**: Supabase官方 + 调试监控

### 4. 登录体验说明

#### 测试环境
```
✅ 显示🐱🐮预设用户快速登录
✅ 显示普通邮箱密码登录表单
✅ Session过期后自动填充上次邮箱
```

#### 正式环境
```
✅ 仅显示简洁的邮箱密码登录表单
✅ Session过期后自动填充上次邮箱
✅ 用户只需输入密码即可重新登录
✅ 完全依赖Supabase官方安全标准
```

### 5. 安全特性

- **零密码存储**: 客户端不存储任何密码信息
- **官方标准**: 完全依赖 Supabase 行业安全标准
- **会话管理**: 自动刷新、持久化、安全过期机制
- **最小权限**: 仅存储必要的邮箱地址
- **一键清除**: 在设置页面可以清除保存的邮箱

### 6. 部署检查清单

在部署之前，确认：

- [ ] ✅ 环境变量已正确设置
- [ ] ✅ `NEXT_PUBLIC_APP_ENV=production`
- [ ] ✅ 代码中没有硬编码的测试数据
- [ ] ✅ Supabase 配置正确
- [ ] ✅ 数据库连接正常

### 7. 验证部署结果

部署完成后，访问网站验证：

1. **登录页面**: 不应显示🐱🐮预设用户的快速登录选项
2. **调试工具**: 时区测试、时间控制器、Session监控器应该完全隐藏
3. **登录体验**: 仅显示简洁的邮箱密码登录表单
4. **密码修改**: 应该连接到真实的 Supabase Auth
5. **Session管理**: 依赖Supabase官方自动刷新机制

### 8. 常见问题

#### Q: 为什么部署后还是显示测试环境的功能？
A: 检查环境变量是否正确设置，特别是 `NEXT_PUBLIC_APP_ENV=production`

#### Q: Session过期后需要重新输入邮箱吗？
A: 不需要！系统会自动填充上次登录的邮箱，您只需输入密码即可

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
