import whiteboardConfig from 'config'

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverComponentsExternalPackages: ['@tldraw/tldraw'],
		appDir: true,
	},
	// FastifyサーバーをNext.jsの開発サーバーと統合する
	webpack: (config) => {
		config.externals.push({
			'fastify': 'commonjs fastify',
			'ws': 'commonjs ws'
		});
		return config;
	},
	env: {
		NEXT_PUBLIC_SERVER_URL : "http://" + whiteboardConfig.get<string>('host') + ":" + whiteboardConfig.get<number>('port'),
		NEXT_PUBLIC_DRAWIO_URL : whiteboardConfig.get<string>('drawio_url')
	}
}

module.exports = nextConfig
