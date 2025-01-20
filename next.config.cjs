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
	}
}

module.exports = nextConfig
