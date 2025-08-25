# 🚀 Supabase 设置指南

## 第一步：创建Supabase项目

1. **访问Supabase**: 在浏览器中打开 [https://supabase.com](https://supabase.com)

2. **注册/登录**: 
   - 点击 "Start your project"
   - 使用GitHub/Google账号快速注册

3. **创建新项目**:
   - 点击 "New project"
   - 项目信息：
     - **Name**: `LovePlanner`
     - **Database Password**: 设置强密码并记住
     - **Region**: 选择 `Asia Pacific (Tokyo)` 
     - **Pricing Plan**: 选择 "Free tier"

4. **等待项目创建** (1-2分钟)

## 第二步：运行数据库初始化

1. **获取项目信息**:
   - 在Supabase项目dashboard中，点击左侧的 `Settings` > `API`
   - 记录下：
     - `Project URL` (格式: https://xxx.supabase.co)
     - `anon/public` API key (以 eyJ 开头的长字符串)

2. **运行SQL脚本**:
   - 在Supabase项目中，点击左侧的 `SQL Editor`
   - 点击 "New query"
   - 复制 `supabase-init.sql` 文件的全部内容
   - 粘贴到SQL编辑器中
   - 点击 "Run" 执行脚本

3. **验证创建结果**:
   - 点击左侧的 `Table Editor`
   - 应该看到这些表：
     - `user_profiles`
     - `couples`
     - `tasks`
     - `task_history`
     - `events`
     - `point_transactions`
     - `shop_items`
     - `purchases`

## 第三步：配置项目环境变量

1. **创建环境文件**:
   ```bash
   cp env.example .env.local
   ```

2. **编辑 `.env.local`** 文件，填入实际值:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...你的匿名密钥...
   ```

## 第四步：测试连接

1. **启动开发服务器**:
   ```bash
   npm run dev
   ```

2. **打开浏览器** 访问 http://localhost:3000

3. **检查控制台** 确保没有Supabase连接错误

## 第五步：配置认证（可选）

如果你想要自定义认证页面：

1. **在Supabase Dashboard**:
   - 去 `Authentication` > `Settings`
   - 配置 `Site URL`: `http://localhost:3000` (开发) / `你的域名` (生产)
   - 配置 `Redirect URLs`: 添加回调URL

2. **邮箱模板**:
   - 在 `Authentication` > `Email Templates` 中自定义邮件模板

## 文件说明

### 已创建的文件：
- `src/lib/supabase.ts` - Supabase客户端配置和类型定义
- `src/hooks/useAuth.ts` - 认证状态管理Hook
- `src/services/database.ts` - 数据库操作服务函数
- `supabase-init.sql` - 数据库初始化脚本
- `env.example` - 环境变量模板

### 下一步需要创建：
- 登录/注册页面
- 用户档案管理
- 数据迁移脚本（从localStorage到数据库）

## 故障排除

### 常见问题：

1. **连接错误**: 检查 `.env.local` 中的URL和密钥是否正确
2. **权限错误**: 确保RLS策略正确配置
3. **类型错误**: 确保数据库schema与TypeScript类型定义一致

### 有用的SQL查询：

```sql
-- 查看所有表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 检查RLS策略
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 查看用户档案
SELECT * FROM auth.users;
SELECT * FROM public.user_profiles;
```

## 🎉 完成！

设置完成后，你的LovePlanner应用就具备了：
- ✅ 用户认证系统
- ✅ 完整的数据库结构  
- ✅ 安全的数据访问权限
- ✅ 类型安全的数据操作

现在可以开始实现登录页面和数据迁移功能了！
