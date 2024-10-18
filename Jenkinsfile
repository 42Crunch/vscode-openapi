pipeline {
    agent any

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
                sh 'cp /build/extension.vsix .'
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'extension.vsix'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
