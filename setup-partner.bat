@echo off
chcp 65001 >nul

REM 🤝 LovePlanner 合作伙伴快速设置脚本 (Windows版)

echo 🎉 欢迎使用 LovePlanner 快速设置脚本！
echo ========================================

REM 检查Node.js
echo 📋 检查系统要求...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装。请访问 https://nodejs.org/ 下载并安装。
    pause
    exit /b 1
)

echo ✅ Node.js: 
node --version
echo ✅ npm: 
npm --version

REM 安装依赖
echo.
echo 📦 安装项目依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败。请检查网络连接或手动运行 'npm install'。
    pause
    exit /b 1
)
echo ✅ 依赖安装成功！

REM 检查环境变量文件
echo.
echo 🔧 检查环境配置...
if not exist ".env.local" (
    echo ⚠️  未找到 .env.local 文件。
    echo 📝 创建示例环境变量文件...
    
    (
    echo # Supabase配置
    echo # 请填入您的Supabase项目信息
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    echo.
    echo # 开发环境标识
    echo NODE_ENV=development
    ) > .env.local
    
    echo ✅ 已创建 .env.local 文件。
    echo ⚠️  请编辑 .env.local 文件，填入正确的Supabase配置信息。
) else (
    echo ✅ 找到现有的 .env.local 文件。
)

REM 数据库提示
echo.
echo 🗄️  准备测试数据库连接...
echo 请确保已在Supabase中执行了数据库设置脚本：
echo   - database/smart_task_setup.sql
echo   - 或 database/fixed_simple_task_setup.sql

REM 构建检查
echo.
echo 🔍 检查项目构建...
npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 项目构建成功！
) else (
    echo ⚠️  项目构建有问题。启动开发服务器时可能会看到详细错误信息。
)

REM 完成提示
echo.
echo 🎉 设置完成！
echo ========================================
echo.
echo 📋 下一步操作：
echo 1. 编辑 .env.local 文件，填入Supabase配置
echo 2. 在Supabase中执行数据库设置脚本
echo 3. 运行 'npm run dev' 启动开发服务器
echo 4. 访问 http://localhost:3000
echo.
echo 🔧 常用命令：
echo   npm run dev     - 启动开发服务器
echo   npm run build   - 构建生产版本
echo   npm run start   - 启动生产服务器
echo   npm run lint    - 检查代码质量
echo.
echo 📚 更多信息请查看 COLLABORATION_SETUP_GUIDE.md
echo.
echo 🚀 准备好开始了吗？运行: npm run dev

pause
