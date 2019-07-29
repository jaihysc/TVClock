# TVClock

Displays configurable tasks, schedule and more (Listed below) on any screen, originally made for myself as a way to keep track of my tasks

Utilises a server which is configured by multiple connected clients

## Details

### Display Information

* Tasks
* Schedule
* Weather (Forecast + UV Index)
* Notices (Fetched from a Google Doc, janky, but offers mobile support)

### Supported Operating Systems

* Windows
* Mac **(Untested)**
* Linux

### Configuration

API keys and weather location can all be changed in the client or server application

## Compiling and running source

### Server

* Import dependencies from Gradle
* For notices, a google doc **credentials.json** file is required to be placed in the TVClock Server directory ```src/main/resources/tvclockserver/credentials.json```

**Running** | Run the gradle task in ```Gradle > Tasks > application > run```

### Client

* Typescript: ```npm install -g typescript```
* Others can be installed with ```npm install``` in TVClock Client directory

Build and run scripts are included, in TVClock Client directory:

**Building** | ```npm build```

**Running**  | ```npm start```

## Screenshots

![Server appearance](https://i.imgur.com/oysiL5Y.png "Server appearance")

![Client todo](https://i.imgur.com/DuRJjIU.png "Client todo")

![Client schedule](https://i.imgur.com/7QsWPHb.png "Client schedule")

![Client settings](https://i.imgur.com/kNTMyVE.png "Client settings")

## Planned features

### Server | Multiple resolutions

Currently the server has font scaling issues on resolutions other than 1920x1080

### Client | Mobile compatible application

Currently the notice bar operates by fetching text from a google doc, this could be upgraded by creating a mobile version of the client application
