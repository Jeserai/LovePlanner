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

        // 统一像素风配色方案
        pixel: {
          // 功能色彩（两个主题共用相同的强调色）
          accent: '#ff0080',    // 霓虹粉色强调
          success: '#00ff88',   // 霓虹绿色成功
          warning: '#ffff00',   // 霓虹黄色警告
          info: '#00d4ff',      // 霓虹蓝色信息
          purple: '#9d4eff',    // 霓虹紫色
          pink: '#ff1493',      // 粉色
          orange: '#ff6a00',    // 橙色
          cyan: '#00ffff',      // 青色
          lime: '#39ff39',      // 青柠色
          
          // 深色主题变量（默认）
          bg: '#1a1a2e',        // 深色背景
          panel: '#2a2a40',     // 深色面板背景
          card: '#353555',      // 深色卡片背景
          text: '#ffffff',      // 白色文字
          textMuted: '#aaaacc', // 灰色文字
          border: '#4a4a66',    // 边框色
        },

        // 浪漫粉色系主题配色方案
        romantic: {
          // 主色调 - 温柔粉色系
          primary: '#f8bbd9',     // 淡粉色主色
          secondary: '#fce4ec',   // 极淡粉色辅色
          accent: '#e91e63',      // 深粉色强调
          
          // 背景色系
          bg: '#fdf2f8',          // 玫瑰白背景
          panel: '#fcf5f9',       // 淡玫瑰面板
          card: '#ffffff',        // 纯白卡片
          
          // 文字色系
          text: '#2d1b2e',        // 深紫灰文字
          textMuted: '#6b5b73',   // 中紫灰文字
          textLight: '#9ca3af',   // 浅灰文字
          
          // 边框色系
          border: '#f3e8ff',      // 淡紫边框
          borderLight: '#fce7f3', // 极淡粉边框
          
          // 功能色彩 - 温柔版本
          success: '#10b981',     // 温柔绿色
          warning: '#f59e0b',     // 温柔橙色
          error: '#ef4444',       // 温柔红色
          info: '#3b82f6',        // 温柔蓝色
          
          // 特殊色彩
          heart: '#ff69b4',       // 爱心粉
          cherry: '#ff1493',      // 樱桃粉
          lavender: '#dda0dd',    // 薰衣草紫
          peach: '#ffcccb',       // 桃色
          cream: '#fffacd',       // 奶油色
        },

        // 清新淡雅简约主题配色方案
        fresh: {
          // 主色调 - 清新绿色系
          primary: '#d1fae5',     // 极淡绿色主色
          secondary: '#ecfdf5',   // 淡薄荷绿辅色
          accent: '#10b981',      // 清新绿强调
          
          // 背景色系
          bg: '#f8fafc',          // 极淡灰白背景
          panel: '#f1f5f9',       // 淡蓝灰面板
          card: '#ffffff',        // 纯白卡片
          
          // 文字色系
          text: '#1e293b',        // 深灰蓝文字
          textMuted: '#64748b',   // 中灰蓝文字
          textLight: '#94a3b8',   // 浅灰文字
          
          // 边框色系
          border: '#e2e8f0',      // 淡灰边框
          borderLight: '#f1f5f9', // 极淡灰边框
          
          // 功能色彩 - 简约版本
          success: '#059669',     // 深绿色
          warning: '#d97706',     // 琥珀色
          error: '#dc2626',       // 红色
          info: '#0284c7',        // 天蓝色
          
          // 用户专属色彩
          catColor: '#06b6d4',    // 青色 - Cat用户
          cowColor: '#8b5cf6',    // 紫色 - Cow用户
          
          // 特殊色彩
          mint: '#6ee7b7',        // 薄荷绿
          sage: '#84cc16',        // 鼠尾草绿
          sky: '#0ea5e9',         // 天空蓝
          lavender: '#a78bfa',    // 淡紫色
          cream: '#fef3c7',       // 奶油黄
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
        // 浪漫主题：柔和圆角
        'romantic': '12px',
        'romantic-sm': '8px',
        'romantic-lg': '16px',
        'romantic-xl': '20px',
        'romantic-full': '9999px',
        // 清新主题：简约圆角
        'fresh': '8px',
        'fresh-sm': '6px',
        'fresh-lg': '12px',
        'fresh-xl': '16px',
        'fresh-full': '9999px',
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
        // 浪漫主题：柔和梦幻阴影
        'romantic': '0 8px 32px rgba(233, 30, 99, 0.08), 0 4px 16px rgba(248, 187, 217, 0.12)',
        'romantic-sm': '0 4px 16px rgba(233, 30, 99, 0.06), 0 2px 8px rgba(248, 187, 217, 0.08)',
        'romantic-lg': '0 12px 48px rgba(233, 30, 99, 0.12), 0 6px 24px rgba(248, 187, 217, 0.16)',
        'romantic-glow': '0 0 20px rgba(255, 105, 180, 0.3), 0 0 40px rgba(255, 105, 180, 0.1)',
        'romantic-heart': '0 0 15px rgba(255, 105, 180, 0.4), 0 4px 16px rgba(255, 20, 147, 0.2)',
        // 清新主题：简约轻盈阴影
        'fresh': '0 4px 24px rgba(16, 185, 129, 0.06), 0 2px 12px rgba(30, 41, 59, 0.04)',
        'fresh-sm': '0 2px 12px rgba(16, 185, 129, 0.04), 0 1px 6px rgba(30, 41, 59, 0.02)',
        'fresh-lg': '0 8px 40px rgba(16, 185, 129, 0.08), 0 4px 20px rgba(30, 41, 59, 0.06)',
        'fresh-glow': '0 0 16px rgba(16, 185, 129, 0.2), 0 0 32px rgba(16, 185, 129, 0.1)',
        'fresh-border': '0 0 0 1px rgba(16, 185, 129, 0.1), 0 2px 8px rgba(30, 41, 59, 0.04)',

      },
      backgroundImage: {
        // 统一像素风背景（主题无关）
        'pixel-accent': 'linear-gradient(45deg, #ff0080, #ff1493)',
        'pixel-glow': 'radial-gradient(circle, rgba(255, 0, 128, 0.3) 0%, rgba(0, 212, 255, 0.1) 50%, transparent 100%)',
        'pixel-success': 'linear-gradient(45deg, #00ff88, #32cd32)',
        'pixel-warning': 'linear-gradient(45deg, #ffff00, #ffd700)',
        'pixel-info': 'linear-gradient(45deg, #00d4ff, #87ceeb)',
        // 浪漫主题：温柔梦幻渐变
        'romantic-primary': 'linear-gradient(135deg, #f8bbd9, #fce4ec)',
        'romantic-accent': 'linear-gradient(135deg, #e91e63, #ff69b4)',
        'romantic-heart': 'linear-gradient(45deg, #ff69b4, #ff1493)',
        'romantic-sunset': 'linear-gradient(135deg, #fdf2f8, #fce7f3, #f3e8ff)',
        'romantic-glow': 'radial-gradient(circle, rgba(255, 105, 180, 0.2) 0%, rgba(233, 30, 99, 0.1) 50%, transparent 100%)',
        'romantic-cherry': 'linear-gradient(45deg, #ff1493, #dda0dd)',
        'romantic-peach': 'linear-gradient(135deg, #ffcccb, #fffacd)',
        // 清新主题：简约清新渐变
        'fresh-primary': 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
        'fresh-accent': 'linear-gradient(135deg, #10b981, #059669)',
        'fresh-mint': 'linear-gradient(45deg, #6ee7b7, #34d399)',
        'fresh-sky': 'linear-gradient(135deg, #f8fafc, #e2e8f0, #cbd5e1)',
        'fresh-glow': 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.05) 50%, transparent 100%)',
        'fresh-cat': 'linear-gradient(45deg, #06b6d4, #0891b2)',
        'fresh-cow': 'linear-gradient(45deg, #8b5cf6, #7c3aed)',

      },
      // 像素风专用动画
      animation: {
        'pixel-pulse': 'pixel-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pixel-bounce': 'pixel-bounce 1s infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite alternate',
        'neon-flicker': 'neon-flicker 0.15s infinite linear',
        'cyberpunk-slide': 'cyberpunk-slide 0.5s ease-out',
        // 浪漫主题动画
        'romantic-float': 'romantic-float 3s ease-in-out infinite',
        'romantic-glow': 'romantic-glow 2s ease-in-out infinite alternate',
        'romantic-heartbeat': 'romantic-heartbeat 1.5s ease-in-out infinite',
        'romantic-sparkle': 'romantic-sparkle 1.8s linear infinite',
        'romantic-fade-in': 'romantic-fade-in 0.5s ease-out',
        // 清新主题动画
        'fresh-breathe': 'fresh-breathe 4s ease-in-out infinite',
        'fresh-wave': 'fresh-wave 3s ease-in-out infinite',
        'fresh-bounce': 'fresh-bounce 2s ease-in-out infinite',
        'fresh-slide': 'fresh-slide 0.6s ease-out',
        'fresh-fade': 'fresh-fade 0.4s ease-out',

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
        // 浪漫主题关键帧动画
        'romantic-float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-8px)',
          }
        },
        'romantic-glow': {
          '0%': {
            boxShadow: '0 0 15px rgba(255, 105, 180, 0.3)',
          },
          '100%': {
            boxShadow: '0 0 25px rgba(255, 105, 180, 0.6), 0 0 35px rgba(233, 30, 99, 0.3)',
          }
        },
        'romantic-heartbeat': {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '25%': {
            transform: 'scale(1.05)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
          '75%': {
            transform: 'scale(1.05)',
          }
        },
        'romantic-sparkle': {
          '0%, 100%': {
            opacity: '0.6',
            transform: 'rotate(0deg) scale(1)',
          },
          '50%': {
            opacity: '1',
            transform: 'rotate(180deg) scale(1.2)',
          }
        },
        'romantic-fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          }
        },
        // 清新主题关键帧动画
        'fresh-breathe': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.02)',
            opacity: '0.9',
          }
        },
        'fresh-wave': {
          '0%, 100%': {
            transform: 'translateX(0px) rotate(0deg)',
          },
          '25%': {
            transform: 'translateX(2px) rotate(1deg)',
          },
          '75%': {
            transform: 'translateX(-2px) rotate(-1deg)',
          }
        },
        'fresh-bounce': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-6px)',
          }
        },
        'fresh-slide': {
          '0%': {
            transform: 'translateX(-20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          }
        },
        'fresh-fade': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          }
        },

      }
    },
  },
  plugins: [],
} 