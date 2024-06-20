# RentBy Backend API

![logo rentby kuning](Logo-Kuning-RentBy.png)

This is a backend project built with Node.js, Express and redis. It is deployed using Google Cloud services including Cloud Storage, App Engine, and Cloud Firestore. This guide will help you get started with setting up, running, and deploying the application.

## Table of Contents

- [Prequisites](#prequisites)
- [Libraries](#libraries)
- [Installation](#installation)
- [Configuration](#configuration)
- [Runing the Application](#runing-the-application)
- [Deployment](#deployment)

## Prequisites

- [Node.js (v20 or higher)](https://nodejs.org/en)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [Google Cloud SDK](https://cloud.google.com/sdk?hl=en)
- [redis](https://redis.io/)


## Libraries
These are main libraries that are used to create the backend service
- [Express](https://expressjs.com/)
- [Midtrans](https://midtrans.com/en)

## Installation
To get a local copy up and running, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/Rentby/rentby-backend.git
    ```

2. Install Dependencies
     ```sh
    npm install
    ```

## Configuration

1. Environment Variables:
Create a .env file in the root of your project and add the following variables:
    ```sh
    API_KEY=your-api-key
    MIDTRANS_SERVER_KEY=SB-Mid-server-yourkey
    REDIS_CLIENT_DATABASE=redis://default:password@redis-xxxx.c1.server.gce.redns.redis-cloud.com:port
    ```

2. Service Account:
Create a service account with Storage Object Creator permission in Cloud IAM and store the key in serviceAccountKey.json file in the root of your project

## Runing the Application

To get a local copy up and running, follow these steps:

1. Start NodeJS Application:
    ```sh
    npm run start
    ```

2. Development Mode
     ```sh
    npm run dev
    ```

## Deployment
App Engine

1. Deploy to App Engine
    ```sh
    gcloud app deploy
    ```
   #

<p align="center">
    Made by the RentBy Team
</p>
