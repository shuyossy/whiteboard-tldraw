'use client'
import { Suspense } from 'react';
import WhiteboardWithFolders from '@/app/component/WhiteboardWithFolders'
import { Loading } from '@/app/component/Loading'

export default function Home() {
	return (
	  	<main style={{ margin: 0, padding: 0 }}>
			<Suspense fallback={<Loading/>}>
				<WhiteboardWithFolders />
			</Suspense>
	  	</main>
	)
}