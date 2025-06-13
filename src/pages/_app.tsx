import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useRouter } from 'next/router';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // 根据当前路径设置页面标题
  const getPageTitle = () => {
    const path = router.pathname;
    switch (path) {
      case '/settings':
        return 'Settings - Love Planner';
      case '/calendar':
        return 'Calendar - Love Planner';
      case '/tasks':
        return 'Tasks - Love Planner';
      default:
        return 'Love Planner';
    }
  };

  return (
    <ThemeProvider>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content="Love Planner - Your personal relationship planning assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
} 