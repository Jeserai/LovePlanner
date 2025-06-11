/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        display: ['Quicksand', 'sans-serif'],
        // 像素风字体
        pixel: ['Courier New', 'monospace'],
        retro: ['VT323', 'monospace'],
      },
      colors: {
        // 梦幻莫内风格：极浅的水莲花粉色
        primary: {
          50: '#fefcfe',
          100: '#fdf6fd',
          200: '#faedf9',
          300: '#f5dcf4',
          400: '#edc3ec',
          500: '#e1a5e0', // 梦幻莲花粉
          600: '#d085cf',
          700: '#b967b8',
          800: '#995199',
          900: '#7d447d',
        },
        // 梦幻莫内风格：极浅的薄荷梦境绿
        secondary: {
          50: '#f8fdfb',
          100: '#f0faf6',
          200: '#e1f4eb',
          300: '#cdebd9',
          400: '#b0ddc0',
          500: '#8ccca5', // 薄荷梦境绿
          600: '#6bb88a',
          700: '#549871',
          800: '#467c5d',
          900: '#3b664e',
        },
        // 梦幻莫内风格：天空梦境蓝
        blue: {
          50: '#f7faff',
          100: '#eff4ff',
          200: '#dfe8ff',
          300: '#c7d6ff',
          400: '#a5bbff',
          500: '#7d9eff', // 天空梦境蓝
          600: '#5a7dff',
          700: '#4461f2',
          800: '#364fd9',
          900: '#3144b3',
        },
        // 梦幻莫内风格：柔和日落橙
        orange: {
          50: '#fffcf8',
          100: '#fff7f0',
          200: '#ffeedd',
          300: '#ffdfc2',
          400: '#ffc794',
          500: '#ffab5e', // 柔和日落橙
          600: '#ff8f2a',
          700: '#e67315',
          800: '#bf5d10',
          900: '#9c4d12',
        },
        // 梦幻莫内风格：浅薰衣草紫
        lavender: {
          50: '#fcfbff',
          100: '#f8f5ff',
          200: '#f0eaff',
          300: '#e6d7ff',
          400: '#d8bbff',
          500: '#c598ff', // 浅薰衣草紫
          600: '#b370ff',
          700: '#9d4eff',
          800: '#8339e6',
          900: '#6b2fbf',
        },
        // 梦幻莫内风格：云雾鼠尾草绿
        sage: {
          50: '#fafbfa',
          100: '#f4f6f4',
          200: '#e8ece8',
          300: '#d6ddd6',
          400: '#bcc7bc',
          500: '#9dac9d', // 云雾鼠尾草绿
          600: '#7f8e7f',
          700: '#687368',
          800: '#565e56',
          900: '#484f48',
        },
        // 新增：梦幻白色系
        dream: {
          50: '#fefefe',
          100: '#fdfdfd',
          200: '#fafafa',
          300: '#f5f5f5',
          400: '#eeeeee',
          500: '#e0e0e0',
          600: '#c2c2c2',
          700: '#a3a3a3',
          800: '#858585',
          900: '#666666',
        },
        // 像素风配色方案 - 更亮的赛博朋克霓虹风格
        pixel: {
          // 8位游戏机经典色彩 - 更亮的赛博朋克版本
          bg: '#1a1a2e',        // 更亮的背景 (从 #0a0a0f 改为更亮)
          panel: '#2a2a40',     // 更亮的面板背景 (从 #151520 改为更亮)
          card: '#353555',      // 更亮的卡片背景 (从 #1f1f2e 改为更亮)
          accent: '#ff0080',    // 霓虹粉色强调
          success: '#00ff88',   // 霓虹绿色成功
          warning: '#ffff00',   // 霓虹黄色警告
          info: '#00d4ff',      // 霓虹蓝色信息
          purple: '#9d4eff',    // 更亮的霓虹紫色
          pink: '#ff1493',      // 深粉色
          orange: '#ff6a00',    // 更亮的霓虹橙色
          cyan: '#00ffff',      // 霓虹青色
          lime: '#39ff39',      // 更亮的霓虹绿
          text: '#ffffff',      // 白色文字
          textMuted: '#aaaacc', // 更亮的灰色文字 (从 #888899 改为更亮)
          border: '#4a4a66',    // 更亮的边框色 (从 #333344 改为更亮)
        },
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        // 像素风：不使用圆角
        'pixel': '0px',
      },
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.03)',
        'cutesy': '0 8px 24px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
        'monet': '0 10px 40px rgba(140, 204, 165, 0.08), 0 4px 12px rgba(140, 204, 165, 0.05)',
        'dream': '0 8px 32px rgba(197, 152, 255, 0.08), 0 2px 8px rgba(197, 152, 255, 0.04)',
        // 像素风：使用硬阴影 + 霓虹发光效果
        'pixel': '4px 4px 0px #000000, 0 0 10px rgba(255, 0, 128, 0.5)',
        'pixel-sm': '2px 2px 0px #000000, 0 0 5px rgba(255, 0, 128, 0.3)',
        'pixel-lg': '6px 6px 0px #000000, 0 0 15px rgba(255, 0, 128, 0.7)',
        'pixel-neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'pixel-neon-strong': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor',
      },
      backgroundImage: {
        'monet-gradient': 'linear-gradient(135deg, #f7faff 0%, #f8fdfb 25%, #fffcf8 50%, #fcfbff 75%, #fafbfa 100%)',
        'water-lily': 'linear-gradient(to bottom right, #7d9eff, #8ccca5)',
        'sunrise': 'linear-gradient(to top, #ffab5e, #7d9eff)',
        'dream-mist': 'linear-gradient(45deg, rgba(225, 165, 224, 0.1), rgba(140, 204, 165, 0.1), rgba(125, 158, 255, 0.1))',
        // 像素风背景
        'pixel-bg': 'linear-gradient(135deg, #1a1a2e 0%, #2a2a40 50%, #353555 100%)',
        'pixel-card': 'linear-gradient(135deg, #353555 0%, #2a2a40 100%)',
        'pixel-accent': 'linear-gradient(45deg, #ff0080, #ff1493)',
        'pixel-glow': 'radial-gradient(circle, rgba(255, 0, 128, 0.3) 0%, rgba(0, 212, 255, 0.1) 50%, transparent 100%)',
      },
      // 像素风专用动画
      animation: {
        'pixel-pulse': 'pixel-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pixel-bounce': 'pixel-bounce 1s infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite alternate',
        'neon-flicker': 'neon-flicker 0.15s infinite linear',
        'cyberpunk-slide': 'cyberpunk-slide 0.5s ease-out',
      },
      keyframes: {
        'pixel-pulse': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '.8',
            transform: 'scale(1.05)'
          },
        },
        'pixel-bounce': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-4px)',
          },
        },
        'neon-glow': {
          '0%': {
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor',
            opacity: '0.8'
          },
          '100%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
            opacity: '1'
          }
        },
        'neon-flicker': {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '1',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.8',
          }
        },
        'cyberpunk-slide': {
          '0%': {
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        }
      }
    },
  },
  plugins: [],
} 