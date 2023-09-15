
# Laju

Ship your next project faster with Laju.

Equipped with the *best* and the *fastest* web technology. 

## Tech Stack

**FrontEnd:** [Svelte](https://learn.svelte.dev/tutorial/welcome-to-svelte), [Inertia](https://inertiajs.com/), [TailwindCSS](https://tailwindcss.com/), [esbuild](https://esbuild.github.io/)

**BackEnd:** [Hyper Express](https://github.com/kartikk221/hyper-express), Typescript

**Database** : [Knex.js](https://knexjs.org/)


## Get Started

Clone this repo and install packages

```bash
  git clone https://github.com/maulanashalihin/laju.git
  npm install
  cp .env.example .env
  npm run dev
```

### Route to Controller

Create your first API with this simple flow

    // web.ts

    import UserController from "../app/controllers/UserController"; 

    Route.get("/user",UserController.index);



```bash

// UserController.ts

class Controller {

  public async index (request,response) { 

    const users = await DB.from("users");

    return response.json(users)
  } 

}

export default new Controller()
```


 
###  File Generator

Speed up development process with File Generator.

#### 1. Generate Controller

Controller is some function to handle REST 

Generate new Controller with **node laju make:controller ControllerFile**

```bash
    node laju make:controller User 
```

```bash

// Generated Controller Script

class Controller {

  public async index (request,response) { 
  }

  public async create (request,response) {
  }

  public async store (request,response) {
  }

  public async show (request,response) {
  }

  public async edit (request,response) {
  }

  public async update (request,response) {
  }

  public async destroy (request,response) {
  }

}

export default new Controller()
```
      
 

#### 2. Generate Command

Create Command Line App then you can trigger with cron

Generate new CommandFile with **node laju make:command CommandFile**

```bash
   node laju make:command UnsubUser 
```
command file will be generated in commands folder. you can execute the file with `npx ts-node commands/CommandFile.ts` (development) or `node build/commands/CommandFile.js` (production)


#### 2. Generate Migration
```bash
  npx knex migrate:make MigrationName
```
you can create migration files and seeder file with using native knex cli. you can learn it further here. https://knexjs.org/guide/migrations.html

    


### Folder Structure

    .
    ├── app                     # Main App (mostly touch files)
    │   ├── controllers         # controllerss
    │   ├── middlewares         # request interceptor
    │   └── services            # reusable services such as connecting to DB and Redis Service
    ├── benchmark               # Source files to compare this framework
    ├── build                   # compiled JS files
    ├── commands                # files to use as command line service
    ├── migrations              # create, alter and drop DB tables
    ├── public                  # static file of your apps
    ├── resources               # front end files
    │   ├── js                  # js folders
    │   └── views               # server side rending files
    ├── routes                  # route configuration
    ├── env.example
    ├── .gitignore
    ├── laju
    ├── clean
    ├── knexfile.ts
    ├── nodemon.json
    ├── package.json
    ├── postcss.config.js
    ├── sync_version
    ├── tailwind.config.js
    ├── esbuild.watch.js
    ├── esbuild.build.js
    └── tsconfig.json

 
    
### Inertia
create https://inertiajs.com/ with by passing the inertia file in Pages folder like this.

    public async loginPage (request,response) { 
 
        return response.inertia("auth/login")
    
    }


## Documentation

You can study the stacks in the repository in the respective library documentation.

[1. Hyper Express](https://github.com/kartikk221/hyper-express)


[2. Svelte](https://learn.svelte.dev/tutorial/welcome-to-svelte)


[3. Inertia](https://inertiajs.com/)


[4. TailwindCSS](https://tailwindcss.com/)


[5. Knex.js](https://knexjs.org/)


[6. Redis](https://github.com/redis/node-redis)


[7. esbuild](https://esbuild.github.io/)



    
### Benchmark Results
**Note!** these benchmark test in Macbook Air M1. test script in benchmark folder.

|                          | Version | Requests/s | Latency | Throughput/s |
| :--                      | --:     | :-:        | --:     | --:          | 
| Laju                     | 6.5.9   | 193,834    |  2.04ms  | 17.38 Mb/s  |
| Native NodeJS            | 18.16.0  | 72,670    |  5.45ms  | 11.09 Mb/s  | 
