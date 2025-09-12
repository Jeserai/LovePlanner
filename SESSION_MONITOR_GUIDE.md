# Session Monitor 使用指南

## 🎯 功能介绍

Session Monitor 是一个专为测试环境设计的会话状态监控组件，帮助开发者实时了解 Supabase 会话的状态和过期情况。

## 📱 功能特性

### 🔍 实时监控
- **登录状态**：显示当前用户是否已登录
- **过期倒计时**：实时显示session距离过期的剩余时间
- **用户信息**：显示当前登录用户的邮箱
- **Token信息**：显示Access Token和Refresh Token的前缀

### ⏰ 倒计时警告
- 🟢 **安全**：剩余时间 > 15分钟
- 🟡 **注意**：剩余时间 5-15分钟
- 🟠 **警告**：剩余时间 < 5分钟
- 🔴 **过期**：已过期或未登录

### 🔄 自动刷新监控
- **自动检测**：监听Supabase的自动Token刷新
- **刷新时间**：显示最后一次刷新的时间
- **手动刷新**：提供手动刷新按钮用于测试

## 🎨 主题适配

### Modern/Fresh 主题
```
🔐 Session Monitor
状态: 已登录
用户: cat@loveplanner.com
过期: 45分23秒
Access: eyJhbGciO...
Refresh: B8k2nF4p...
刷新: 14:30:25
[🔄 手动刷新]
```

### Pixel 主题
```
>>> SESSION STATUS <<<
状态: 已登录
用户: cat@loveplanner.com  
过期: 45分23秒
Access: eyJhbGciO...
Refresh: B8k2nF4p...
刷新: 14:30:25
[MANUAL REFRESH]
```

## 🔧 使用方法

### 1. 启用方式
组件只在测试环境中显示，通过 `enableDebugFeatures` 控制：

```bash
# 开发环境（自动启用）
npm run dev

# 测试正式环境效果（隐藏监控器）
npm run dev:prod
```

### 2. 位置
- **固定位置**：右下角浮动显示
- **层级**：`z-50`，不会被其他内容遮挡
- **响应式**：自适应不同屏幕尺寸

### 3. 交互功能

#### 手动刷新Token
```javascript
// 点击"手动刷新"按钮会触发：
await supabase.auth.refreshSession();
```

#### 实时状态监听
```javascript
// 自动监听所有认证事件：
supabase.auth.onAuthStateChange((event, session) => {
  // TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT 等
});
```

## 📊 监控数据说明

### Session 过期时间
- **默认时长**：Supabase 默认为1小时
- **自动刷新**：过期前自动刷新
- **刷新阈值**：通常在过期前5-10分钟刷新

### Token 类型
- **Access Token**：用于API请求认证
- **Refresh Token**：用于获取新的Access Token

### 刷新机制
```
正常流程：
1. 用户登录 → 获得1小时有效期的Token
2. 50分钟后 → Supabase自动刷新Token
3. 获得新的1小时Token → 循环继续

异常情况：
1. 网络问题 → 自动刷新失败
2. 显示过期警告 → 用户需要重新登录
```

## 🧪 测试场景

### 1. 正常登录测试
```bash
1. 启动开发环境：npm run dev
2. 登录：cat@loveplanner.com / 123456
3. 观察监控器：应显示"已登录"和倒计时
```

### 2. 自动刷新测试
```bash
1. 登录后等待约50分钟
2. 观察监控器：应显示自动刷新事件
3. 倒计时重置：重新开始1小时倒计时
```

### 3. 手动刷新测试
```bash
1. 登录后点击"手动刷新"按钮
2. 观察状态：按钮显示"刷新中..."
3. 完成后：更新"刷新时间"和倒计时
```

### 4. 会话过期测试
```bash
# 注意：这需要较长时间测试
1. 禁用自动刷新（修改Supabase配置）
2. 等待Token自然过期
3. 观察监控器：显示"已过期"状态
```

## 🚀 实际使用价值

### 开发调试
- **问题定位**：快速判断认证问题是否由Token过期引起
- **性能监控**：观察自动刷新的频率和时机
- **状态验证**：确认登录状态在各个页面的一致性

### 用户体验测试
- **无感刷新**：验证用户不会感知到Token刷新过程
- **跨标签页**：测试多标签页之间的状态同步
- **网络异常**：模拟网络问题时的行为

### 部署验证
- **环境隔离**：确认正式环境不会显示调试信息
- **配置验证**：确认Supabase配置在不同环境的正确性

## ⚠️ 注意事项

1. **仅测试环境**：正式环境不会显示此组件
2. **性能影响**：每秒更新倒计时，对性能影响极小
3. **安全考虑**：只显示Token前缀，不泄露完整Token
4. **自动清理**：组件会自动清理定时器，避免内存泄漏

## 🔍 故障排除

### 组件不显示
```bash
# 检查环境配置
console.log('Debug Features:', enableDebugFeatures);

# 应该在开发环境返回 true
```

### 倒计时不更新
```bash
# 检查会话状态
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### 自动刷新不工作
```bash
# 检查Supabase配置
console.log('Supabase Config:', supabase.auth.settings);
```

---

这个Session Monitor为您的开发和测试提供了强大的会话状态可视化功能！🎉
