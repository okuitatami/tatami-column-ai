module.exports = {
  apps: [
    {
      name: 'webapp-training',
      script: 'npx',
      args: 'wrangler pages dev dist-training --d1=webapp-production --local --ip 0.0.0.0 --port 3002',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
