pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr:'5'))
    }

    stages {
        stage('Checkout sources') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            agent {
                dockerfile {
                    filename 'Dockerfile'
                    reuseNode true
                }
            }

            steps {
                sh 'cp /build/*.vsix .'
                sh 'cp /build/spdx-report.json .'
                sh 'cp /build/stats.txt .'
                script {
                    def issues = sh(script: 'cat /build/total-issues.txt', returnStdout: true).trim().toInteger()
                    def lines = sh(script: 'cat /build/total-lines.txt', returnStdout: true).trim().toInteger()
                    def errorsPerThousandLines = (issues / lines) * 1000
                    echo "Total lines of code: ${lines}"
                    echo "Total issues: ${issues}"
                    echo "Errors per thousand lines: ${errorsPerThousandLines}"
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '*.vsix, spdx-report.json, stats.txt'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
