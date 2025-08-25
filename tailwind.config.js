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
        // 星露谷字体
        stardew: ['Press Start 2P', 'monospace'],
      },
      colors: {

        // 像素风配色方案 - 深色赛博朋克霓虹风格
        pixel: {
          // 8位游戏机经典色彩 - 深色赛博朋克版本
          bg: '#1a1a2e',        // 深色背景
          panel: '#2a2a40',     // 深色面板背景
          card: '#353555',      // 深色卡片背景
          accent: '#ff0080',    // 霓虹粉色强调
          success: '#00ff88',   // 霓虹绿色成功
          warning: '#ffff00',   // 霓虹黄色警告
          info: '#00d4ff',      // 霓虹蓝色信息
          purple: '#9d4eff',    // 霓虹紫色
          pink: '#ff1493',      // 深粉色
          orange: '#ff6a00',    // 霓虹橙色
          cyan: '#00ffff',      // 霓虹青色
          lime: '#39ff39',      // 霓虹绿
          text: '#ffffff',      // 白色文字
          textMuted: '#aaaacc', // 灰色文字
          border: '#4a4a66',    // 边框色
        },
        // 浅色像素风配色方案 - 明亮清新的8位游戏风格
        lightPixel: {
          // 浅色8位游戏机经典色彩 - 明亮清新版本
          bg: '#f0f4f8',        // 浅蓝灰色背景
          panel: '#ffffff',     // 纯白面板背景
          card: '#e8f2ff',      // 淡蓝色卡片背景
          accent: '#ff6b9d',    // 樱花粉色强调
          success: '#52c41a',   // 明亮绿色成功
          warning: '#fa8c16',   // 明亮橙色警告
          info: '#1890ff',      // 明亮蓝色信息
          purple: '#722ed1',    // 明亮紫色
          pink: '#eb2f96',      // 明亮粉色
          orange: '#fa541c',    // 明亮橙红色
          cyan: '#13c2c2',      // 明亮青色
          lime: '#a0d911',      // 明亮青柠色
          yellow: '#fadb14',    // 明亮黄色
          indigo: '#597ef7',    // 明亮靛蓝色
          text: '#262626',      // 深灰色文字
          textMuted: '#8c8c8c', // 中灰色文字
          border: '#d9d9d9',    // 浅灰色边框
          borderDark: '#bfbfbf', // 深一点的边框
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
        // 星露谷：小圆角
        'stardew': '4px',
      },
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.03)',
        'cutesy': '0 8px 24px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
        'monet': '0 10px 40px rgba(140, 204, 165, 0.08), 0 4px 12px rgba(140, 204, 165, 0.05)',
        'dream': '0 8px 32px rgba(197, 152, 255, 0.08), 0 2px 8px rgba(197, 152, 255, 0.04)',
        // 深色像素风：使用硬阴影 + 霓虹发光效果
        'pixel': '4px 4px 0px #000000, 0 0 10px rgba(255, 0, 128, 0.5)',
        'pixel-sm': '2px 2px 0px #000000, 0 0 5px rgba(255, 0, 128, 0.3)',
        'pixel-lg': '6px 6px 0px #000000, 0 0 15px rgba(255, 0, 128, 0.7)',
        'pixel-neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'pixel-neon-strong': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor',
        // 浅色像素风：使用硬阴影 + 明亮色彩
        'light-pixel': '3px 3px 0px #bfbfbf, 0 2px 8px rgba(0, 0, 0, 0.1)',
        'light-pixel-sm': '2px 2px 0px #d9d9d9, 0 1px 4px rgba(0, 0, 0, 0.08)',
        'light-pixel-lg': '4px 4px 0px #a6a6a6, 0 4px 12px rgba(0, 0, 0, 0.12)',
        'light-pixel-colored': '3px 3px 0px rgba(255, 107, 157, 0.3), 0 2px 8px rgba(255, 107, 157, 0.2)',
        'light-pixel-success': '3px 3px 0px rgba(82, 196, 26, 0.3), 0 2px 8px rgba(82, 196, 26, 0.2)',
        'light-pixel-warning': '3px 3px 0px rgba(250, 140, 22, 0.3), 0 2px 8px rgba(250, 140, 22, 0.2)',

      },
      backgroundImage: {
        // 深色像素风背景
        'pixel-bg': 'linear-gradient(135deg, #1a1a2e 0%, #2a2a40 50%, #353555 100%)',
        'pixel-card': 'linear-gradient(135deg, #353555 0%, #2a2a40 100%)',
        'pixel-accent': 'linear-gradient(45deg, #ff0080, #ff1493)',
        'pixel-glow': 'radial-gradient(circle, rgba(255, 0, 128, 0.3) 0%, rgba(0, 212, 255, 0.1) 50%, transparent 100%)',
        // 浅色像素风背景
        'light-pixel-bg': 'linear-gradient(135deg, #f0f4f8 0%, #e8f2ff 50%, #ffffff 100%)',
        'light-pixel-card': 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        'light-pixel-accent': 'linear-gradient(45deg, #ff6b9d, #eb2f96)',
        'light-pixel-glow': 'radial-gradient(circle, rgba(255, 107, 157, 0.15) 0%, rgba(24, 144, 255, 0.1) 50%, transparent 100%)',
        'light-pixel-success': 'linear-gradient(45deg, #52c41a, #73d13d)',
        'light-pixel-warning': 'linear-gradient(45deg, #fa8c16, #ffa940)',
        'light-pixel-info': 'linear-gradient(45deg, #1890ff, #40a9ff)',

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
        },

      }
    },
  },
  plugins: [],
} 