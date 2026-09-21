import type { Metadata } from 'next';
import './globals.css';
import './reference-theme.css';
export const metadata:Metadata={title:'한걸음 | 재현의 2027 한의대 입시 전략',description:'학교별 목표 점수와 가산점을 비교하는 한의대 정시 전략·점수 시뮬레이터'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ko"><body>{children}</body></html>;}
