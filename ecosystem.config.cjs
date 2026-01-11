module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "blogi",
      script: "node_modules/.bin/next",
      args: `start -p ${process.env.PORT || 3000}`,
      cwd: process.env.APP_CWD || __dirname,
      kill_timeout: 5000,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
