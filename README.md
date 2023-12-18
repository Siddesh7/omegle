# Omegle but Push Chat

## Description

This project randomly connects 2 peers online and opens up a Push chat between the peers.

## Getting Started


### Installation - Server

1. Navigate to the server directory:

    ```bash
    cd server
    ```

2. Install dependencies using Yarn or npm:

    ```bash
    # Using Yarn
    yarn

    # Using npm
    npm install
    ```

3. Start the Server:

```bash
# Using Yarn
yarn start

# Using npm
npm start
```


#### The server will run on the specified port (default is 3001).

### Installation - Client

1. Navigate to the server directory:

    ```bash
    cd client
    ```

2. Install dependencies using Yarn or npm:

    ```bash
    # Using Yarn
    yarn

    # Using npm
    npm install
    ```
3. Start the Client:

```bash
# Using Yarn
yarn start

# Using npm
npm start
```



## Incase of polyfills error, 

run ```npm install stream-http stream-browserify https-browserify browserify-zlib assert url``` and add this code snippet in your `webpack config`

```
resolve:{
   fallback: {
        "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "url": require.resolve("url/"),
      "assert": require.resolve("assert/"),
      "stream": require.resolve("stream-browserify")
  },
}
```





