'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ClientLoader() {
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const t = setTimeout(() => setLoading(false), 300)
		return () => clearTimeout(t)
	}, [])

	return (
		<AnimatePresence>
			{loading && (
				<motion.div
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.6, ease: 'easeInOut' }}
					className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
				>
					{/* Spinner */}
					<div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
				</motion.div>
			)}
		</AnimatePresence>
	)
}
