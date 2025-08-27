# 数据库连接问题解决方案

## 问题描述
打开网页时出现"无法连接到数据库"的弹窗，这是因为缺少Supabase环境变量配置。

## 解决步骤

### 步骤1: 创建环境变量文件
在项目根目录创建 `.env.local` 文件：

```bash
# 在项目根目录执行
touch .env.local
```

### 步骤2: 配置Supabase信息
将以下内容复制到 `.env.local` 文件中，并替换为你的实际值：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名公钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

### 步骤3: 获取Supabase配置信息

1. **登录Supabase控制台**：https://supabase.com/dashboard
2. **选择你的项目**
3. **进入设置 > API**
4. **复制以下信息**：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 步骤4: 重启开发服务器
配置完成后，重启Next.js开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
# 或
yarn dev
```

## 如果还是不行

### 检查1: 确认文件位置
确保 `.env.local` 文件在项目根目录（与 `package.json` 同级）：

```
LovePlanner/
├── .env.local          ← 应该在这里
├── package.json
├── src/
└── ...
```

### 检查2: 确认变量格式
`.env.local` 文件内容示例：

```env
NEXT_PUBLIC_SUPABASE_URL=https://fcmafxrypfqocflupmdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

注意：
- 不要有空格
- 不要有引号
- URL必须是完整的https://格式

### 检查3: 浏览器控制台
打开浏览器开发者工具（F12），查看控制台是否有相关错误信息。

### 检查4: Supabase项目状态
确认Supabase项目：
- 项目处于活跃状态
- 没有暂停或删除
- 数据库已正确初始化

## 临时解决方案

如果你还没有Supabase项目，可以暂时使用演示模式：

1. **编辑 `src/components/Calendar.tsx`**
2. **找到第41行附近**，强制设置演示模式：

```typescript
// 将这行：
const [dataMode, setDataMode] = useState<DataMode>(user ? 'database' : 'mock');

// 临时改为：
const [dataMode, setDataMode] = useState<DataMode>('mock');
```

这样可以暂时使用本地模拟数据，不需要数据库连接。

## 验证连接

配置完成后，在浏览器控制台应该看到：
- ✅ "已设置演示模式的情侣用户信息" 或
- ✅ "找到情侣关系，couple_id: xxx"

而不是：
- ⚠️ "Supabase环境变量未配置"

## 创建Supabase项目（如果没有）

如果你还没有Supabase项目：

1. **访问** https://supabase.com
2. **注册/登录账号**
3. **点击 "New Project"**
4. **填写项目信息**：
   - Name: LovePlanner
   - Database Password: 设置一个强密码
   - Region: 选择离你最近的区域
5. **等待项目创建完成**（约2-3分钟）
6. **按上述步骤配置环境变量**

## 需要帮助？

如果以上步骤都无法解决问题，请提供：
1. 浏览器控制台的完整错误信息
2. `.env.local` 文件的内容（隐藏敏感信息）
3. Supabase项目状态截图
