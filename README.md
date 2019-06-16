# screeps-client
Custom client for Screeps using PIXI.js. The code was designed with the mobile devices in mind. The application can be easly wrapped by cordova and run natively as an application on the phone.

![screenshot1](https://raw.githubusercontent.com/keeshii/screeps-client/gh-pages/screeps-1.png)
![screenshot2](https://raw.githubusercontent.com/keeshii/screeps-client/gh-pages/screeps-2.png)
![screenshot3](https://raw.githubusercontent.com/keeshii/screeps-client/gh-pages/screeps-3.png)
![screenshot4](https://raw.githubusercontent.com/keeshii/screeps-client/gh-pages/screeps-4.png)

# How to use
Due to CORS it is not possible to connect to anything hosted on the other domain than the client app. You have several options to overcome this problem.

* Bundle the package with `cordova`/`electron`/`node-webkit` or any other tool which runs the page in the environment not limited by CORS,
* Host the page on the same domain as your screeps server. You will need a web server that works as proxy for both client and server,
* Inject the code as suggested by the [ricochet1k](https://github.com/ricochet1k/screeps-client#how-to-use).

# Connecting to server

Make sure to install screepsmod-auth. User can register only if server is not protected by the password. Once registered the password can be set.

It is possible to register to servers with password, but it requires a single change in the [register.js](https://github.com/ScreepsMods/screepsmod-auth/blob/f7d6a6135e04a9c9f5c578b6778b0a15556bc836/lib/register.js#L39) of screepsmod-auth. The conditional statement should be following:
```
if(process.env.SERVER_PASSWORD !== body.serverPassword) return res.json({
    error: "Registration is automatically disabled. A server password has been set."
})
```

# What works
- Room view
- Room minimaps
- Typing in room names to view them
- Most actionLog animations
- RoomVisuals
- Console output
- Map view
- Code editing (barely)
- Typing console commands
- Registering a new account

# What still needs implemented
See issues for the full list. Notably:
- Mouse interaction
- Memory view
- Replay view
- Login using Steam or Github
