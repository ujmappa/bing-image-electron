
# Bing ImageCreator Electron package
Introducing minimal prompt templating system in unofficial Bing Image Creator application. This version is more for developers and technical people who understand the code and will not go for support immediately. I usually don't like to say that, but only run it if you do understand what the code does.

You can modify templates and pointed database entries in ./resources. Environment variables are in ./resources/application.env

To understand "Run" entries there is a limit of generations which is done in one run. A `counter` variable states how many generation have been done. Templates are processed in order or randomly. In case of ordered execution it will have a template `index` of current position.

- Play: run the prompts in template.json
- Stop: stop running the prompts, reset the `counter`
- Pause: stop running the prompts, don't reset `counter`
- Rewind: set back template `index` to zero
- Restart: reset `counter`, reset template `index`, play

If you have enjoyed my work and wish to support what I do, please consider buying me a coffee! I would appreciate it very much and it helps me to continue to do what I do. Thank you! 

[https://ko-fi.com/ujmappa](https://ko-fi.com/ujmappa)


## What's good in Electron
- You see your creations and possible errors
- You can check and manage your rewards
- You can switch accounts and continue creation
- You don't have to look for authentication values

## What's the catch?
- Memory and CPU consumption of course
- It's a browser with an own storage

## Known issues in beta
- One image is missing, one is duplicated
- Minimalistic error handling regarding prompts
- Currently build is only tested on Windows x64
- Lack of proper templating package

## Database and templates
- A template is a prompt that can have variables 
- Variables point to a specific entry in database 
- Use ${artist} or ${artist*} in template.json to lookup one "artist" entry in database.json

## Environment variables
- DEST: Where to save the images. Directory should exist.
- RAND: Set to "true" to choose randomly from templates
- LIMIT: Program will try to generate this many images in one run
