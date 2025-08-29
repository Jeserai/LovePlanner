/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Nunito',
  				'sans-serif'
  			],
  			display: [
  				'Quicksand',
  				'sans-serif'
  			],
  			pixel: [
  				'Courier New',
  				'monospace'
  			],
  			retro: [
  				'VT323',
  				'monospace'
  			],
  			stardew: [
  				'Press Start 2P',
  				'monospace'
  			]
  		},
  		colors: {
  			pixel: {
  				accent: '#ff0080',
  				success: '#00ff88',
  				warning: '#ffff00',
  				info: '#00d4ff',
  				purple: '#9d4eff',
  				pink: '#ff1493',
  				orange: '#ff6a00',
  				cyan: '#00ffff',
  				lime: '#39ff39',
  				bg: '#1a1a2e',
  				panel: '#2a2a40',
  				card: '#353555',
  				text: '#ffffff',
  				textMuted: '#aaaacc',
  				border: '#4a4a66'
  			},
  			romantic: {
  				primary: '#f8bbd9',
  				secondary: '#fce4ec',
  				accent: '#e91e63',
  				bg: '#fdf2f8',
  				panel: '#fcf5f9',
  				card: '#ffffff',
  				text: '#2d1b2e',
  				textMuted: '#6b5b73',
  				textLight: '#9ca3af',
  				border: '#f3e8ff',
  				borderLight: '#fce7f3',
  				success: '#10b981',
  				warning: '#f59e0b',
  				error: '#ef4444',
  				info: '#3b82f6',
  				heart: '#ff69b4',
  				cherry: '#ff1493',
  				lavender: '#dda0dd',
  				peach: '#ffcccb',
  				cream: '#fffacd'
  			},
  			fresh: {
  				primary: '#d1fae5',
  				secondary: '#ecfdf5',
  				accent: '#10b981',
  				bg: '#f8fafc',
  				panel: '#f1f5f9',
  				card: '#ffffff',
  				text: '#1e293b',
  				textMuted: '#64748b',
  				textLight: '#94a3b8',
  				border: '#e2e8f0',
  				borderLight: '#f1f5f9',
  				success: '#059669',
  				warning: '#d97706',
  				error: '#dc2626',
  				info: '#0284c7',
  				catColor: '#06b6d4',
  				cowColor: '#8b5cf6',
  				mint: '#6ee7b7',
  				sage: '#84cc16',
  				sky: '#0ea5e9',
  				lavender: '#a78bfa',
  				cream: '#fef3c7'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		maxWidth: {
  			'8xl': '88rem',
  			'9xl': '96rem'
  		},
  		borderRadius: {
  			xl: '1rem',
  			'2xl': '1.5rem',
  			pixel: '0px',
  			stardew: '4px',
  			romantic: '12px',
  			'romantic-sm': '8px',
  			'romantic-lg': '16px',
  			'romantic-xl': '20px',
  			'romantic-full': '9999px',
  			fresh: '8px',
  			'fresh-sm': '6px',
  			'fresh-lg': '12px',
  			'fresh-xl': '16px',
  			'fresh-full': '9999px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 4px 14px 0 rgba(0, 0, 0, 0.03)',
  			cutesy: '0 8px 24px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
  			monet: '0 10px 40px rgba(140, 204, 165, 0.08), 0 4px 12px rgba(140, 204, 165, 0.05)',
  			dream: '0 8px 32px rgba(197, 152, 255, 0.08), 0 2px 8px rgba(197, 152, 255, 0.04)',
  			pixel: '4px 4px 0px #000000, 0 0 10px rgba(255, 0, 128, 0.5)',
  			'pixel-sm': '2px 2px 0px #000000, 0 0 5px rgba(255, 0, 128, 0.3)',
  			'pixel-lg': '6px 6px 0px #000000, 0 0 15px rgba(255, 0, 128, 0.7)',
  			'pixel-neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
  			'pixel-neon-strong': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor',
  			'light-pixel': '3px 3px 0px #bfbfbf, 0 2px 8px rgba(0, 0, 0, 0.1)',
  			'light-pixel-sm': '2px 2px 0px #d9d9d9, 0 1px 4px rgba(0, 0, 0, 0.08)',
  			'light-pixel-lg': '4px 4px 0px #a6a6a6, 0 4px 12px rgba(0, 0, 0, 0.12)',
  			'light-pixel-colored': '3px 3px 0px rgba(255, 107, 157, 0.3), 0 2px 8px rgba(255, 107, 157, 0.2)',
  			'light-pixel-success': '3px 3px 0px rgba(82, 196, 26, 0.3), 0 2px 8px rgba(82, 196, 26, 0.2)',
  			'light-pixel-warning': '3px 3px 0px rgba(250, 140, 22, 0.3), 0 2px 8px rgba(250, 140, 22, 0.2)',
  			romantic: '0 8px 32px rgba(233, 30, 99, 0.08), 0 4px 16px rgba(248, 187, 217, 0.12)',
  			'romantic-sm': '0 4px 16px rgba(233, 30, 99, 0.06), 0 2px 8px rgba(248, 187, 217, 0.08)',
  			'romantic-lg': '0 12px 48px rgba(233, 30, 99, 0.12), 0 6px 24px rgba(248, 187, 217, 0.16)',
  			'romantic-glow': '0 0 20px rgba(255, 105, 180, 0.3), 0 0 40px rgba(255, 105, 180, 0.1)',
  			'romantic-heart': '0 0 15px rgba(255, 105, 180, 0.4), 0 4px 16px rgba(255, 20, 147, 0.2)',
  			fresh: '0 4px 24px rgba(16, 185, 129, 0.06), 0 2px 12px rgba(30, 41, 59, 0.04)',
  			'fresh-sm': '0 2px 12px rgba(16, 185, 129, 0.04), 0 1px 6px rgba(30, 41, 59, 0.02)',
  			'fresh-lg': '0 8px 40px rgba(16, 185, 129, 0.08), 0 4px 20px rgba(30, 41, 59, 0.06)',
  			'fresh-glow': '0 0 16px rgba(16, 185, 129, 0.2), 0 0 32px rgba(16, 185, 129, 0.1)',
  			'fresh-border': '0 0 0 1px rgba(16, 185, 129, 0.1), 0 2px 8px rgba(30, 41, 59, 0.04)'
  		},
  		backgroundImage: {
  			'pixel-accent': 'linear-gradient(45deg, #ff0080, #ff1493)',
  			'pixel-glow': 'radial-gradient(circle, rgba(255, 0, 128, 0.3) 0%, rgba(0, 212, 255, 0.1) 50%, transparent 100%)',
  			'pixel-success': 'linear-gradient(45deg, #00ff88, #32cd32)',
  			'pixel-warning': 'linear-gradient(45deg, #ffff00, #ffd700)',
  			'pixel-info': 'linear-gradient(45deg, #00d4ff, #87ceeb)',
  			'romantic-primary': 'linear-gradient(135deg, #f8bbd9, #fce4ec)',
  			'romantic-accent': 'linear-gradient(135deg, #e91e63, #ff69b4)',
  			'romantic-heart': 'linear-gradient(45deg, #ff69b4, #ff1493)',
  			'romantic-sunset': 'linear-gradient(135deg, #fdf2f8, #fce7f3, #f3e8ff)',
  			'romantic-glow': 'radial-gradient(circle, rgba(255, 105, 180, 0.2) 0%, rgba(233, 30, 99, 0.1) 50%, transparent 100%)',
  			'romantic-cherry': 'linear-gradient(45deg, #ff1493, #dda0dd)',
  			'romantic-peach': 'linear-gradient(135deg, #ffcccb, #fffacd)',
  			'fresh-primary': 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
  			'fresh-accent': 'linear-gradient(135deg, #10b981, #059669)',
  			'fresh-mint': 'linear-gradient(45deg, #6ee7b7, #34d399)',
  			'fresh-sky': 'linear-gradient(135deg, #f8fafc, #e2e8f0, #cbd5e1)',
  			'fresh-glow': 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.05) 50%, transparent 100%)',
  			'fresh-cat': 'linear-gradient(45deg, #06b6d4, #0891b2)',
  			'fresh-cow': 'linear-gradient(45deg, #8b5cf6, #7c3aed)'
  		},
  		animation: {
  			'pixel-pulse': 'pixel-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'pixel-bounce': 'pixel-bounce 1s infinite',
  			'neon-glow': 'neon-glow 2s ease-in-out infinite alternate',
  			'neon-flicker': 'neon-flicker 0.15s infinite linear',
  			'cyberpunk-slide': 'cyberpunk-slide 0.5s ease-out',
  			'romantic-float': 'romantic-float 3s ease-in-out infinite',
  			'romantic-glow': 'romantic-glow 2s ease-in-out infinite alternate',
  			'romantic-heartbeat': 'romantic-heartbeat 1.5s ease-in-out infinite',
  			'romantic-sparkle': 'romantic-sparkle 1.8s linear infinite',
  			'romantic-fade-in': 'romantic-fade-in 0.5s ease-out',
  			'fresh-breathe': 'fresh-breathe 4s ease-in-out infinite',
  			'fresh-wave': 'fresh-wave 3s ease-in-out infinite',
  			'fresh-bounce': 'fresh-bounce 2s ease-in-out infinite',
  			'fresh-slide': 'fresh-slide 0.6s ease-out',
  			'fresh-fade': 'fresh-fade 0.4s ease-out'
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
  				}
  			},
  			'pixel-bounce': {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-4px)'
  				}
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
  					opacity: '1'
  				},
  				'20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
  					opacity: '0.8'
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
  			'romantic-float': {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-8px)'
  				}
  			},
  			'romantic-glow': {
  				'0%': {
  					boxShadow: '0 0 15px rgba(255, 105, 180, 0.3)'
  				},
  				'100%': {
  					boxShadow: '0 0 25px rgba(255, 105, 180, 0.6), 0 0 35px rgba(233, 30, 99, 0.3)'
  				}
  			},
  			'romantic-heartbeat': {
  				'0%, 100%': {
  					transform: 'scale(1)'
  				},
  				'25%': {
  					transform: 'scale(1.05)'
  				},
  				'50%': {
  					transform: 'scale(1.1)'
  				},
  				'75%': {
  					transform: 'scale(1.05)'
  				}
  			},
  			'romantic-sparkle': {
  				'0%, 100%': {
  					opacity: '0.6',
  					transform: 'rotate(0deg) scale(1)'
  				},
  				'50%': {
  					opacity: '1',
  					transform: 'rotate(180deg) scale(1.2)'
  				}
  			},
  			'romantic-fade-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fresh-breathe': {
  				'0%, 100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'50%': {
  					transform: 'scale(1.02)',
  					opacity: '0.9'
  				}
  			},
  			'fresh-wave': {
  				'0%, 100%': {
  					transform: 'translateX(0px) rotate(0deg)'
  				},
  				'25%': {
  					transform: 'translateX(2px) rotate(1deg)'
  				},
  				'75%': {
  					transform: 'translateX(-2px) rotate(-1deg)'
  				}
  			},
  			'fresh-bounce': {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-6px)'
  				}
  			},
  			'fresh-slide': {
  				'0%': {
  					transform: 'translateX(-20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			'fresh-fade': {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} 