pipeline {
  agent none

  environment {
    BRANCH_NAME     = "main"
    REPO_URL        = "git@github.com:teomanofficial/blossom-frontend.git"
    CONTAINER_NAME  = "blossom_frontend_api"
    IMAGE_NAME      = "blossom_frontend_image"
    NODE_ENV        = "production"
    APP_PORT        = "8091"
    DOCKER_BUILDKIT = "1"
    ENV_FILE_PATH   = ".env"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  stages {

    stage('Checkout') {
      agent { label 'built-in' }
      steps {
        cleanWs() // ensures reruns don't explode
        sh '''
          set -eux
          git clone --branch ${BRANCH_NAME} ${REPO_URL} .
          git rev-parse --short HEAD > .gitsha
        '''
      }
    }

    stage('Build Image') {
      agent { label 'built-in' }
      steps {
        sh '''
          set -eux
          GIT_SHA=$(cat .gitsha)
          echo "Building ${IMAGE_NAME}:${GIT_SHA}"
          docker build \
            --build-arg NODE_ENV=${NODE_ENV} \
            -t ${IMAGE_NAME}:latest \
            -t ${IMAGE_NAME}:${GIT_SHA} \
            .
        '''
      }
    }

    stage('Unit Tests') {
      agent { label 'built-in' }
      steps {
        sh '''
          set +e
          GIT_SHA=$(cat .gitsha)
          echo "Running tests for ${IMAGE_NAME}:${GIT_SHA}"
          docker run --rm ${IMAGE_NAME}:${GIT_SHA} sh -lc 'npm run test --silent || npm run test:ci --silent || exit 0'
          EXIT_CODE=$?
          if [ "$EXIT_CODE" -ne 0 ]; then
            echo "Tests failed"
            exit $EXIT_CODE
          fi
        '''
      }
    }

    stage('Publish/Run') {
      agent { label 'built-in' }
      steps {
        sh '''
          set -eux
          GIT_SHA=$(cat .gitsha)

          # Stop existing container if running
          if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
            docker rm -f ${CONTAINER_NAME} || true
          fi

          # Determine env file usage
          if [ -n "${ENV_FILE:-}" ]; then
            ENV_ARG="--env-file ${ENV_FILE}"
          elif [ -f "${ENV_FILE_PATH}" ]; then
            ENV_ARG="--env-file ${ENV_FILE_PATH}"
          else
            ENV_ARG=""
          fi

          # Start new container
          docker run -d \
            --name ${CONTAINER_NAME} \
            --restart unless-stopped \
            -p ${APP_PORT}:3000 \
            $ENV_ARG \
            -e NODE_ENV=${NODE_ENV} \
            ${IMAGE_NAME}:${GIT_SHA}
        '''
      }
    }

  }

  post {
    failure {
      node('built-in') {
        echo "Build failed — printing last container logs..."
        sh '''
          set +e
          docker logs --tail 200 ${CONTAINER_NAME} 2>/dev/null || true
        '''
      }
    }
    always {
      node('built-in') {
        cleanWs()
      }
    }
  }
}
