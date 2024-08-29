

module.exports = {
    apps: [
        {
            name: "api-demo-dbchecklist",
            script: "./index.js",
            env: {
                NODE_ENV: 'production',
                PORT: 6969
            }
        }
    ]
}