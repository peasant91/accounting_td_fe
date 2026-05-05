pipeline {
    environment {
        DISCORD_WEBHOOK_URL = credentials('fe-discord-webhook-url')
        HOST = credentials('ssh-host')
        USER = credentials('ssh-username')
        FRONTEND_ENV_DEV = credentials('file-env-dev')
        FRONTEND_ENV_STAGING = credentials('file-env-staging')
        FRONTEND_ENV_PRODUCTION = credentials('file-env-production')
        MENTION_ID = credentials('mention-discord-id')
        PROJECT_NAME = 'Accounting_td Frontend'

        PRODUCTION_DIR = credentials('production-directory')
        STAGING_DIR = credentials('staging-directory')
        DEV_DIR = credentials('development-directory')
    }

    agent any

    stages {
        stage('Deploy') {
            steps {
                script {
                    def branchName = env.BRANCH_NAME
                    def projectDir

                    if (branchName == 'main') {
                        env.FRONTEND_ENV = env.FRONTEND_ENV_PRODUCTION
                        projectDir = PRODUCTION_DIR
                        pm2Name = 'accounting_td-frontend-production'
                    } else if (branchName == 'staging') {
                        env.FRONTEND_ENV = env.FRONTEND_ENV_STAGING
                        projectDir = STAGING_DIR
                        pm2Name = 'accounting_td-frontend-staging'
                    } else if (branchName == 'development') {
                        env.FRONTEND_ENV = env.FRONTEND_ENV_DEV
                        projectDir = DEV_DIR
                        pm2Name = 'accounting_td-frontend-development'
                    } else {
                        echo "Unsupported branch: ${branchName}"
                        currentBuild.result = 'ABORTED'
                        return
                    }

                    sh 'cp "$FRONTEND_ENV" .env'
                    sh 'chmod 600 .env'

                    sh 'docker run --rm -v "$(pwd)":/app -w /app --entrypoint npm node:23 install'
                    sh 'docker run --rm -v "$(pwd)":/app -w /app --entrypoint npm node:23 run build'

                    sshagent(credentials: ['jenkins']) {
                        sh "rsync -azP --delete --exclude='.htaccess' --exclude='ecosystem.config.js' --exclude='logs/' -e 'ssh -p 22 -o StrictHostKeyChecking=no' . ${USER}@${HOST}:${projectDir}"

                        sh "ssh -p 22 -o StrictHostKeyChecking=no ${USER}@${HOST} \"cd ${projectDir} && pm2-20 restart ${pm2Name}\""
                        //sh "ssh -p 22 -o StrictHostKeyChecking=no ${USER}@${HOST} \"cd ${projectDir} && ~/.nvm/versions/node/v22.15.1/bin/pm2 start ${pm2Name}\""
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                def gitLog = sh(script: 'git log -n 5 --format="%h %s (%an)"', returnStdout: true).trim()

                discordSend description: ">>> **Yay !!!** \nProjectmu udah berhasil di deploy yah \n\n Jenkins Pipeline Build [** FINISHED **] \n```\n${gitLog}\n```",
                            footer: "${env.PROJECT_NAME}",
                            link: env.BUILD_URL,
                            result: currentBuild.currentResult,
                            title: "Deploying to ${env.BRANCH_NAME} **SUCCESS**",
                            webhookURL: "${env.DISCORD_WEBHOOK_URL}",
                            thumbnail: "https://media.tenor.com/30TFXsJZzLgAAAAC/happy-anya-spy-x-family.gif",
                            notes: ">>> **Halo kak** ${env.MENTION_ID}"
            }
        }
        failure {
            script {
                def gitLog = sh(script: 'git log -n 5 --format="%h %s (%an)"', returnStdout: true).trim()

                discordSend description: ">>> **Red Arlert,** \nKuleeeee gagal nok, bak cek lagi  \n\n Jenkins Pipeline Build [** FAILED **] \n```\n${gitLog}\n```",
                            footer: "${env.PROJECT_NAME}",
                            link: env.BUILD_URL,
                            result: currentBuild.currentResult,
                            title: "Deploying to ${env.BRANCH_NAME} **FAILED**",
                            webhookURL: "${env.DISCORD_WEBHOOK_URL}",
                            thumbnail: "https://media.tenor.com/jW_f0aRGGwcAAAAC/anya-anya-forger.gif",
                            notes: ">>> **Halo kak** ${env.MENTION_ID}"
            }
        }
    }
}