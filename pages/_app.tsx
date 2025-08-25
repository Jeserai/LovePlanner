import type { AppProps } from 'next/app'
import { NextUIProvider } from '@nextui-org/react'
import '../src/styles/globals.css'
import '../src/styles/lightPixel.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NextUIProvider>
      <Component {...pageProps} />
    </NextUIProvider>
  )
} 