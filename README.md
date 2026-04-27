# Deploy Node.js Retail App to EC2

A complete DevOps implementation for containerizing and deploying a
Node.js Retail Application onto AWS EKS using Docker, Kubernetes, and
GitHub Actions CI/CD with zero-downtime rolling updates.

------------------------------------------------------------------------

## Project Overview

This project takes a Node.js Retail Application built with Express.js
and deploys it to a production-grade AWS EKS Kubernetes cluster. The
deployment is fully automated --- a single `git push` triggers the
entire build, push, and deploy pipeline with no manual steps required.

The key feature is zero-downtime Rolling Updates. When a new version is
deployed, Kubernetes replaces pods gradually ensuring the app stays
available throughout the entire update process.

------------------------------------------------------------------------

## Key Features

-   Automated CI/CD pipeline triggered on every `git push`
-   Zero-downtime Rolling Updates using Kubernetes deployment strategy
-   Docker containerization with GitHub-based build no local builds
    needed
-   Single or two-repository architecture support
-   Deployed on AWS EKS with auto-provisioned nodes and public Load
    Balancer
-   Health-check-driven deployments using Node.js `/` endpoint
-   All credentials managed via GitHub Secrets nothing stored in code or
    images

------------------------------------------------------------------------

## Tech Stack

  Category           Technology
  ------------------ -------------------------------------
  Application        Node.js, Express.js
  Containerization   Docker, Docker Hub
  Orchestration      Kubernetes (AWS EKS)
  CI/CD              GitHub Actions
  Cloud              AWS EKS, AWS EC2, AWS Load Balancer
  Version Control    Git, GitHub

------------------------------------------------------------------------

## Project Structure

    Deploy-Nodejs-Retail-App-to-Kubernetes/
    │
    ├── Dockerfile                        # Builds Node.js app
    ├── package.json                      # Dependencies
    ├── package-lock.json
    ├── .dockerignore                     # Ignored files
    │
    ├── k8s/
    │   ├── deployment.yaml               # Pods + rolling update config
    │   └── service.yaml                  # LoadBalancer service
    │
    └── .github/
        └── workflows/
            └── deploy.yml                # CI/CD pipeline

------------------------------------------------------------------------

## Deployment Steps

Follow these steps to deploy this project from scratch.

**Prerequisites** - AWS account with IAM user (EKS + EC2 permissions) -
Docker installed - AWS CLI configured (`aws configure`) - kubectl
installed - Docker Hub account

**Step 1- Clone this repository**

``` bash
git clone https://github.com/your-username/Deploy-Nodejs-Retail-App.git
cd Deploy-Nodejs-Retail-App
```

**Step 2- Create AWS EKS Cluster**

Go to AWS Console → EKS → Create Cluster. Use Custom configuration with
Auto Mode enabled, name it `retail-cluster`, select region `ap-south-1`,
and attach your cluster IAM role. Wait 10--15 minutes for the cluster to
become Active.

**Step 3- Connect kubectl to the cluster**

``` bash
aws eks update-kubeconfig --region ap-south-1 --name retail-cluster
kubectl get nodes
```

**Step 4- Tag VPC subnets for Load Balancer**

Go to AWS Console → VPC → Subnets. For each public subnet, add this tag:

    Key:   kubernetes.io/role/elb
    Value: 1

**Step 5- Add GitHub Secrets**

Go to your GitHub repo → Settings → Secrets and variables → Actions and
add these secrets:

    DOCKER_USERNAME        → your Docker Hub username
    DOCKER_PASSWORD        → your Docker Hub access token
    AWS_ACCESS_KEY_ID      → your IAM user access key
    AWS_SECRET_ACCESS_KEY  → your IAM user secret key
    AWS_REGION             → ap-south-1

**Step 6- Push to trigger the pipeline**

``` bash
git push origin main
```

Go to the Actions tab on GitHub and watch all stages complete. The
pipeline builds the image, pushes to Docker Hub, and deploys to EKS
automatically.

**Step 7- Fix service selector and security group**

``` bash
kubectl apply -f k8s/service.yaml
```

Go to AWS Console → EC2 → worker node → Security Group → Edit inbound
rules. Add port 80 and port 3000 with source `0.0.0.0/0`.

**Step 8- Get the app URL**

``` bash
kubectl get services
```

Copy the `EXTERNAL-IP` value and open `http://EXTERNAL-IP` in any
browser.

------------------------------------------------------------------------

## CI/CD Pipeline Stages

    Stage 1 — Checkout
      └─ Pull latest code

    Stage 2 — Docker Login
      └─ Authenticate with Docker Hub

    Stage 3 — Build Image
      └─ Build Node.js Docker image

    Stage 4 — Push Image
      └─ Push image to Docker Hub

    Stage 5 — AWS Auth
      └─ Configure AWS credentials
      └─ Update kubeconfig

    Stage 6 — Deploy
      └─ kubectl apply k8s/deployment.yaml
      └─ kubectl apply k8s/service.yaml

    Stage 7 — Verify
      └─ kubectl rollout status
      └─ kubectl get pods + services

------------------------------------------------------------------------

## Zero-Downtime Rolling Update

The deployment is configured with `replicas: 2`, `maxSurge: 1`, and
`maxUnavailable: 0`. This ensures Kubernetes always spins up a new pod
and waits for it to become healthy before terminating an old one.

------------------------------------------------------------------------

## GitHub Secrets Required

Before the pipeline can run, these five secrets must be added:
`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.

------------------------------------------------------------------------

## Related Repository

Application Repo → (Add your Node.js repo link)\
Docker Hub Image → (Add your image link)

------------------------------------------------------------------------

## Group Members

 | Name                 | Enrollment Number |  
|----------------------|-------------------|  
| Anurag Didolkar      | EN22CS301169      |  
| Anuj singh Rathore   | EN22CS301166      |  
| Aniket kushwah       | EN22CS301124      |  
| Arsh Patidar         | EN22CS301204      |  
| Amit Patidar         | EN22CS301114      |  
| Avani Gupta          | EN22CS301236      |  


------------------------------------------------------------------------

-   **Institution**- Medicaps University, Datagami Skill Based Course
-   **Academic Year**- 2025-2026
-   **Industry Mentor**- Prof. Akshay Saxena
